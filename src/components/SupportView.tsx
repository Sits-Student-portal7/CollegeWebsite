import React, { useState } from 'react';
import { SupportTicket, AttachedFile } from '../types';

interface SupportViewProps {
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  onShowToast: (message: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAIAssistant: (prompt?: string) => void;
}

interface FAQItem {
  id: string;
  category: 'Academic' | 'Fees' | 'Portal' | 'Lost & Found';
  question: string;
  answer: string;
  actionTab?: string;
  actionLabel?: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Academic',
    question: 'How do I request an attendance correction?',
    answer:
      'Submit a Leave/Attendance Request form under Academics or contact your subject professor directly. Ensure you have supporting documents (e.g., medical certificates) ready to upload.',
    actionTab: 'academics',
    actionLabel: 'Go to Academics',
  },
  {
    id: 'faq-2',
    category: 'Academic',
    question: 'Where can I download my official semester grade sheet?',
    answer:
      'You can download grade sheets from the Academics section under Marks & Grade Sheets tab, or request an official stamped copy from the Exam Cell.',
    actionTab: 'academics',
    actionLabel: 'View Marks',
  },
  {
    id: 'faq-3',
    category: 'Fees',
    question: 'What should I do if my fee payment fails or remains pending?',
    answer:
      'If money was debited from your bank account but payment shows pending, wait 24 hours for bank settlement. If unresolved, submit a ticket here attaching your bank transaction statement.',
    actionTab: 'fees',
    actionLabel: 'Check Fee Status',
  },
  {
    id: 'faq-4',
    category: 'Lost & Found',
    question: 'How long does it take to process a Lost & Found claim?',
    answer:
      'Lost & Found claims are verified within 1-2 working days by campus security (Admin Block, Room 102). You can also report items directly in the Lost and Found portal.',
    actionTab: 'lost-found',
    actionLabel: 'Lost & Found Portal',
  },
  {
    id: 'faq-5',
    category: 'Portal',
    question: 'How do I reset my portal password or update phone number?',
    answer:
      'Go to the Settings page in the left sidebar to update your email digest options and profile details, or raise a ticket under Technical Bug.',
  },
];

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  setTickets,
  onShowToast,
  onNavigateTab,
  onOpenAIAssistant,
}) => {
  // FAQ state
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  // New Ticket Form state
  const [category, setCategory] = useState('Academic Portal Access');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Active view tab for tickets vs new ticket form
  const [activeTab, setActiveTabState] = useState<'create' | 'tickets'>('create');

  // Filtered FAQs
  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(files).map((file) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      return {
        name: file.name,
        size: formattedSize,
        type: file.type || 'document',
      };
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    onShowToast(`Attached ${newFiles.length} file(s) successfully.`);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      onShowToast('Please fill out the ticket subject and description.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newTicket: SupportTicket = {
        id: `TCK-${Math.floor(4000 + Math.random() * 1000)}`,
        category,
        subject: subject.trim(),
        description: description.trim(),
        status: 'Pending',
        createdAt: 'Just now',
        attachedFiles: [...uploadedFiles],
      };

      setTickets((prev) => [newTicket, ...prev]);
      setIsSubmitting(false);

      // Reset form
      setSubject('');
      setDescription('');
      setUploadedFiles([]);
      setActiveTabState('tickets');

      onShowToast(`Support ticket #${newTicket.id} created successfully!`);
    }, 600);
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Under Review':
        return 'bg-[#EEF2FF] text-[#4338CA] border-indigo-200';
      case 'Pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-indigo-50/40 to-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#4338CA] text-2xl">support_agent</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4338CA]">Help & Support Center</h2>
          </div>
          <p className="text-slate-600 text-sm">
            Find answers to common portal issues or submit a support request with document attachments to university admins.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTabState('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#4338CA] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-[#4338CA] hover:text-[#4338CA]'
            }`}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            New Ticket
          </button>
          <button
            onClick={() => setActiveTabState('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'tickets'
                ? 'bg-[#4338CA] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-[#4338CA] hover:text-[#4338CA]'
            }`}
          >
            <span className="material-symbols-outlined text-base">confirmation_number</span>
            My Tickets ({tickets.length})
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: FAQ Accordion */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4338CA]">quiz</span>
                Frequently Asked Questions
              </h3>

              <div className="relative w-full sm:w-60">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['All', 'Academic', 'Fees', 'Portal', 'Lost & Found'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedFaqCategory === cat
                      ? 'bg-indigo-100 text-[#4338CA] font-bold border border-indigo-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No FAQs match your search query. Try another term or submit a ticket!
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-indigo-200 bg-[#F8FAFC]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer group"
                      >
                        <span className="font-semibold text-slate-900 text-xs md:text-sm pr-2">
                          {faq.question}
                        </span>
                        <span
                          className={`material-symbols-outlined text-slate-400 group-hover:text-[#4338CA] transition-transform duration-200 text-xl shrink-0 ${
                            isExpanded ? 'rotate-180 text-[#4338CA]' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-3 animate-in fade-in duration-150">
                          <p>{faq.answer}</p>
                          {faq.actionTab && (
                            <button
                              onClick={() => onNavigateTab(faq.actionTab)}
                              className="inline-flex items-center gap-1 font-bold text-[#4338CA] hover:underline cursor-pointer"
                            >
                              {faq.actionLabel || 'Learn more'}{' '}
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Ticket Form or My Tickets + Helpdesk Contact */}
        <aside className="lg:col-span-5 space-y-6">
          {activeTab === 'create' ? (
            /* Submit Ticket Card */
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4338CA]">confirmation_number</span>
                Submit a Support Ticket
              </h3>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 p-2.5 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                  >
                    <option>Academic Portal Access</option>
                    <option>Fee Payment Discrepancy</option>
                    <option>Lost & Found Reporting</option>
                    <option>Technical Bug</option>
                    <option>Other Enquiry</option>
                  </select>
                </div>

                {/* Subject Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ticket Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fee status pending after bank debit"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 p-2.5 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your issue with transaction IDs, dates, or error codes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 p-2.5 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                  />
                </div>

                {/* File Upload Drop Zone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload Documents / Proof (PDF, Images, Docs)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#4338CA] bg-indigo-50/60'
                        : 'border-slate-300 hover:border-[#4338CA] bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      id="ticket-file-input"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <label htmlFor="ticket-file-input" className="cursor-pointer block">
                      <span className="material-symbols-outlined text-[#4338CA] text-2xl mb-1 block">
                        cloud_upload
                      </span>
                      <p className="text-xs font-semibold text-slate-700">
                        Drag and drop files here or <span className="text-[#4338CA] underline">browse files</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 10MB each</p>
                    </label>
                  </div>

                  {/* Uploaded Files Chips */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-600">Attached Files ({uploadedFiles.length}):</p>
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-indigo-50/80 border border-indigo-100 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="material-symbols-outlined text-indigo-600 text-sm shrink-0">
                              description
                            </span>
                            <span className="truncate font-medium text-slate-800 text-[11px]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                            title="Remove file"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#4338CA] text-white font-bold py-2.5 rounded-xl hover:bg-indigo-800 active:scale-98 transition-all flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Submitting Ticket...
                    </>
                  ) : (
                    <>
                      Submit Ticket
                      <span className="material-symbols-outlined text-sm">send</span>
                    </>
                  )}
                </button>
              </form>
            </section>
          ) : (
            /* My Tickets List Card */
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4338CA]">history</span>
                  Your Submitted Support Tickets
                </h3>
                <span className="text-xs bg-indigo-50 text-[#4338CA] px-2 py-0.5 rounded-full font-bold">
                  {tickets.length} total
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No support tickets submitted yet. Click "New Ticket" to create one.
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-500">{t.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">{t.subject}</p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                      </div>

                      {t.attachedFiles && t.attachedFiles.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                          {t.attachedFiles.map((file, fIdx) => (
                            <span
                              key={fIdx}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[10px] text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              <span className="material-symbols-outlined text-xs text-indigo-600">attach_file</span>
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>Category: {t.category}</span>
                        <span>{t.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Helpdesk Contact Info Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4338CA]">hub</span>
              Helpdesk Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4338CA] shrink-0">
                  <span className="material-symbols-outlined text-lg">alternate_email</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Support</p>
                  <a href="mailto:support@scholarcore.edu" className="font-bold text-slate-800 hover:text-[#4338CA]">
                    support@scholarcore.edu
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined text-lg">call</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hotline</p>
                  <p className="font-bold text-slate-800">+91 040-2700-1234</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Office Location</p>
                  <p className="font-bold text-slate-800">Admin Block, Ground Floor, Room 102</p>
                </div>
              </div>
            </div>
          </section>

          {/* AI Helper Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4338CA] text-sm">smart_toy</span>
              Need AI Assistance writing a request?
            </h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onOpenAIAssistant('Help me draft an attendance correction support ticket')}
                className="bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors text-left cursor-pointer"
              >
                "Help me draft an attendance correction request"
              </button>
              <button
                onClick={() => onOpenAIAssistant('Who do I call for urgent fee payment issues?')}
                className="bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors text-left cursor-pointer"
              >
                "Who do I contact for urgent fee payment issues?"
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
