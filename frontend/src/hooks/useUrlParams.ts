import { useCallback, useMemo } from 'react';

type ParamConfig = Record<string, string | undefined>;

function getParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function setParams(params: URLSearchParams) {
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState(null, '', url.toString());
}

export function useUrlParams() {
  const params = useMemo(() => getParams(), []);

  const get = useCallback((key: string, fallback: string = ''): string => {
    return params.get(key) || fallback;
  }, [params]);

  const getInt = useCallback((key: string, fallback: number): number => {
    const val = params.get(key);
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? fallback : parsed;
  }, [params]);

  const getBool = useCallback((key: string): boolean | undefined => {
    const val = params.get(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, [params]);

  const sync = useCallback((values: ParamConfig) => {
    const current = getParams();
    for (const [key, val] of Object.entries(values)) {
      if (val === undefined || val === '' || val === 'All' || val === 'all' || val === '1' && key === 'page') {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    }
    setParams(current);
  }, []);

  return { get, getInt, getBool, sync };
}
