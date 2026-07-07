import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

export function useEntryParam(
  ids: string[],
): [string | null, (id: string | null) => void] {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const section = location.pathname.split('/').filter(Boolean)[0];

  useEffect(() => {
    if (!entryId && ids.length > 0) {
      void navigate(`/${section}/${ids[0]}`, { replace: true });
    }
    // Only run when mounting into a new section
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  function setEntry(id: string | null) {
    if (id) {
      void navigate(`/${section}/${id}`);
    } else {
      void navigate(`/${section}`);
    }
  }

  const selected = entryId && ids.includes(entryId) ? entryId : null;
  return [selected, setEntry];
}
