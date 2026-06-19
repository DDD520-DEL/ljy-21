import { useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Tag,
} from 'lucide-react';
import {
  FAQ_DATA,
  FAQ_CATEGORY_LABEL,
  FAQ_CATEGORY_COLOR,
  FAQ_CATEGORY_ICON,
  type FaqCategory,
  type FaqItem,
} from '@/utils/faqData';

const ALL_CATEGORIES: (FaqCategory | 'all')[] = [
  'all',
  'fee_sharing',
  'opinion_survey',
  'construction_impact',
  'post_maintenance',
  'policy_subsidy',
  'project_process',
];

interface FaqItemCardProps {
  item: FaqItem;
  isExpanded: boolean;
  onToggle: () => void;
  searchKeyword?: string;
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text;

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-amber-200 text-amber-900 px-0.5 rounded font-medium"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function FaqItemCard({ item, isExpanded, onToggle, searchKeyword }: FaqItemCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 ${
        isExpanded ? 'shadow-md ring-1 ring-primary-200' : 'hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-4 text-left group"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
              isExpanded ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
            } group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors`}
          >
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`badge text-xs border ${FAQ_CATEGORY_COLOR[item.category]}`}
            >
              {FAQ_CATEGORY_ICON[item.category]} {FAQ_CATEGORY_LABEL[item.category]}
            </span>
            {item.keywords && item.keywords.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {item.keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-0.5 text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded"
                  >
                    <Tag className="w-3 h-3" />
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h4 className="font-medium text-slate-800 leading-relaxed pr-8">
            {highlightText(item.question, searchKeyword || '')}
          </h4>
        </div>

        <div className="flex-shrink-0 ml-auto">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-primary-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5">
          <div className="relative">
            <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary-200 via-primary-100 to-primary-50 rounded-full" />
            <div className="ml-12">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-[15px]">
                {highlightText(item.answer, searchKeyword || '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = filteredFaqs.map((f) => f.id);
    setExpandedIds(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      if (!searchKeyword.trim()) {
        return matchCategory;
      }

      const keyword = searchKeyword.toLowerCase();
      const matchSearch =
        item.question.toLowerCase().includes(keyword) ||
        item.answer.toLowerCase().includes(keyword) ||
        (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(keyword)));

      return matchCategory && matchSearch;
    });
  }, [searchKeyword, categoryFilter]);

  const faqsByCategory = useMemo(() => {
    if (categoryFilter !== 'all') {
      return { [categoryFilter]: filteredFaqs };
    }

    const grouped: Record<string, FaqItem[]> = {};
    for (const item of filteredFaqs) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  }, [filteredFaqs, categoryFilter]);

  const totalCount = FAQ_DATA.length;
  const matchedCount = filteredFaqs.length;

  return (
    <section id="faq" className="bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>常见问题解答</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            加装电梯全流程
            <span className="text-primary-700">常见问题</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            汇总了居民在加装电梯过程中高频询问的 {totalCount} 个问题，
            涵盖费用分摊、意见征询、施工影响、后期维护等关键环节，
            提供专业、权威的标准解答。
          </p>
        </div>

        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索问题关键词，如：费用、分摊、施工、维护、补贴..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input-field !pl-12 w-full !py-3 text-[15px]"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">分类：</span>
              <div className="flex items-center gap-1 flex-wrap">
                {ALL_CATEGORIES.map((cat) => {
                  const isActive = categoryFilter === cat;
                  const label = cat === 'all' ? '全部' : FAQ_CATEGORY_LABEL[cat];
                  const icon = cat === 'all' ? '📚' : FAQ_CATEGORY_ICON[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-primary-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="mr-1">{icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              {searchKeyword ? (
                <span>
                  搜索关键词 "<span className="font-medium text-primary-700">{searchKeyword}</span>"，
                  找到 <span className="font-bold text-slate-700">{matchedCount}</span> 条相关问答
                </span>
              ) : (
                <span>
                  共 <span className="font-bold text-slate-700">{matchedCount}</span> 条问答
                  {categoryFilter !== 'all' && (
                    <>，分类：<span className="font-medium text-primary-700">{FAQ_CATEGORY_LABEL[categoryFilter]}</span></>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                展开全部
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                收起全部
              </button>
            </div>
          </div>
        </div>

        {matchedCount > 0 ? (
          <div className="space-y-8">
            {Object.entries(faqsByCategory).map(([category, items]) => {
              if (items.length === 0) return null;
              const cat = category as FaqCategory;
              return (
                <div key={category}>
                  {categoryFilter === 'all' && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${FAQ_CATEGORY_COLOR[cat]}`}>
                        {FAQ_CATEGORY_ICON[cat]}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-800">
                          {FAQ_CATEGORY_LABEL[cat]}
                        </h3>
                        <p className="text-sm text-slate-500">{items.length} 个问题</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <FaqItemCard
                          item={item}
                          isExpanded={expandedIds.has(item.id)}
                          onToggle={() => toggleExpand(item.id)}
                          searchKeyword={searchKeyword}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              未找到匹配的问题
            </h3>
            <p className="text-slate-500 mb-6">
              尝试使用其他关键词搜索，或选择不同的分类查看
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['费用', '分摊', '施工', '维护', '补贴'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchKeyword(suggestion)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
