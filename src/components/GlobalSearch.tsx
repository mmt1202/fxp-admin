import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAdmin, type GlobalSearchResult } from '../api/search';

const typeLabels: Record<string, string> = {
  user: '用户',
  order: '订单',
  property: '房源',
  community: '小区',
  report: '举报',
  feedback: '反馈',
};

export function GlobalSearch() {
  const inputId = useId();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const q = keyword.trim();
    const controller = new AbortController();

    if (!q) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setResults([]);
          setError('');
          setLoading(false);
        }
      });
      return () => controller.abort();
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      searchAdmin(q)
        .then((items) => {
          if (!controller.signal.aborted) {
            setResults(items);
            setActiveIndex(0);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
            setError('搜索服务暂不可用，请稍后重试。');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const goToResult = (result: GlobalSearchResult) => {
    setKeyword('');
    setResults([]);
    setOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      goToResult(results[activeIndex]);
    }
  };

  const shouldShowPanel = open && (keyword.trim() || loading || error);

  return (
    <div className="global-search" role="search">
      <label className="global-search-input" htmlFor={inputId}>
        <span aria-hidden="true">🔎</span>
        <input
          id={inputId}
          ref={inputRef}
          value={keyword}
          onChange={(event) => { setKeyword(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="全局搜索用户 / 订单 / 房源..."
          autoComplete="off"
        />
        <kbd>/</kbd>
      </label>
      {shouldShowPanel ? <div className="global-search-panel">
        {loading ? <div className="global-search-state">正在搜索...</div> : null}
        {error ? <div className="global-search-state error">{error}</div> : null}
        {!loading && !error && keyword.trim() && results.length === 0 ? <div className="global-search-state">未找到相关结果。</div> : null}
        {!loading && !error && results.map((result, index) => (
          <button
            type="button"
            className={`global-search-result${index === activeIndex ? ' active' : ''}`}
            key={`${result.type}-${result.url}-${index}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => goToResult(result)}
          >
            <span>{typeLabels[result.type] ?? result.type}</span>
            <strong>{result.title}</strong>
            <small>{result.summary}</small>
          </button>
        ))}
      </div> : null}
    </div>
  );
}
