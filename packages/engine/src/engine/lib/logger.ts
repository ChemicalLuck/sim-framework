export interface LoggerOptions {
  enabled?: boolean;
  withTimestamp?: boolean;
  tag?: string;
}

class Logger {
  private _enabled: boolean;
  private withTimestamp: boolean;
  private tag?: string;
  private parent?: Logger;

  private static _instance: Logger | null = null;

  private constructor(options: LoggerOptions = {}, parent?: Logger) {
    this._enabled = options.enabled ?? false;
    this.withTimestamp = options.withTimestamp ?? false;
    this.tag = options.tag;
    this.parent = parent;
  }

  private get enabled(): boolean {
    return this.parent ? this.parent.enabled : this._enabled;
  }

  public static get instance(): Logger {
    Logger._instance ??= new Logger();
    return Logger._instance;
  }

  public configure(options: LoggerOptions) {
    if (options.enabled !== undefined) this._enabled = options.enabled;
    if (options.withTimestamp !== undefined)
      this.withTimestamp = options.withTimestamp;
    if (options.tag !== undefined) this.tag = options.tag;
  }

  public child(tag: string): Logger {
    return new Logger({ tag }, this);
  }

  private prefix(): string {
    const parts: string[] = [];
    if (this.withTimestamp) parts.push(`[${new Date().toISOString()}]`);
    if (this.tag) parts.push(`[${this.tag}]`);
    return parts.join(' ');
  }

  public enable() {
    this._enabled = true;
  }
  public disable() {
    this._enabled = false;
  }

  public group(name: string) {
    if (!this.enabled) return;
    console.group(name);
  }

  public groupCollapsed(name: string) {
    if (!this.enabled) return;
    console.groupCollapsed(name);
  }

  public groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }

  public debug(...msg: unknown[]) {
    if (!this.enabled) return;
    console.debug(this.prefix(), ...msg);
  }

  public info(...msg: unknown[]) {
    console.info(this.prefix(), ...msg);
  }

  public warn(...msg: unknown[]) {
    console.warn(this.prefix(), ...msg);
  }

  public error(...msg: unknown[]) {
    console.error(this.prefix(), ...msg);
  }
}

export const GlobalLogger = Logger.instance;
