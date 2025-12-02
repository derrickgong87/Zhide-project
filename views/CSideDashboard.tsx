import React, { useState, useEffect } from 'react';
import { Candidate, Job, MatchResult } from '../types';
import { getInitialJobs, matchCandidateToJobs, parseResumeWithAI } from '../services/geminiService';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CandidateForm } from '../components/CandidateForm';

// Initial Mock Profile
const INITIAL_PROFILE: Candidate = {
  id: 'me',
  name: 'Alex Chen',
  title: '资深产品总监',
  experienceYears: 8,
  education: '哥伦比亚大学, MBA',
  skills: ['产品战略', '用户增长', '数据分析', '团队管理'],
  currentSalary: '120万',
  status: '面试中',
  summary: '拥有国际视野的产品领导者，寻求B轮以后企业的核心管理岗位。',
};

export const CSideDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'profile'>('jobs');
  const [profile, setProfile] = useState<Candidate>(INITIAL_PROFILE);
  const [matches, setMatches] = useState<{job: Job, match: MatchResult}[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      // Simulate network delay for "Finding best fits"
      await new Promise(r => setTimeout(r, 1200)); 
      
      const allJobs = getInitialJobs();
      const matchResults = await matchCandidateToJobs(profile, allJobs);
      
      const combined = matchResults.map(m => ({
        match: m,
        job: allJobs.find(j => j.id === m.jobId)!
      })).filter(item => item.job).sort((a, b) => b.match.score - a.match.score);
      
      setMatches(combined);
      setLoading(false);
    };

    if (activeTab === 'jobs') {
        fetchMatches();
    }
  }, [profile, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const parsedData = await parseResumeWithAI({ 
            type: 'base64', 
            data: base64Data, 
            mimeType: file.type 
          });
          
          // Merge parsed data with existing profile ID
          setProfile(prev => ({ ...prev, ...parsedData }));
          setIsUploading(false);
          // Optional: Open edit modal to confirm
          setIsEditModalOpen(true);
        } catch (error) {
          console.error(error);
          setIsUploading(false);
          alert('简历解析失败，请手动编辑');
        }
      };
    } catch (e) {
      setIsUploading(false);
    }
  };

  const saveProfile = (data: Partial<Candidate>) => {
    setProfile(prev => ({ ...prev, ...data }));
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 md:pb-0">
      {/* Mobile Top Bar */}
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-20 flex justify-between items-center md:hidden">
        <h1 className="font-bold text-lg tracking-tight">职得 <span className="text-amber-500 text-xs align-top">PRO</span></h1>
        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-100" onClick={() => setActiveTab('profile')}>
           <img src={`https://ui-avatars.com/api/?name=${profile.name}&background=0f172a&color=fff`} alt="Profile" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:pt-10 md:gap-8 md:px-6">
        
        {/* Profile Sidebar (Desktop) */}
        <div className="hidden md:block w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900"></div>
            <div className="px-6 pb-6 -mt-10">
              <div className="h-20 w-20 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md mb-4">
                 <img src={`https://ui-avatars.com/api/?name=${profile.name}&background=0f172a&color=fff&size=128`} alt="Profile" className="w-full h-full object-cover"/>
              </div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{profile.title}</p>
              
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                    {profile.education}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {profile.experienceYears} 年工作经验
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <Button variant="outline" className="w-full" onClick={() => setIsEditModalOpen(true)}>编辑简历</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-0">
          
          {/* Mobile Profile View */}
          <div className={`md:hidden ${activeTab === 'profile' ? 'block' : 'hidden'} animate-fadeIn`}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-slate-100 overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${profile.name}&background=0f172a&color=fff&size=128`} alt="Profile" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{profile.name}</h2>
                      <p className="text-slate-500">{profile.title}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">教育背景</p>
                      <p className="font-medium">{profile.education}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">经验</p>
                      <p className="font-medium">{profile.experienceYears} 年</p>
                    </div>
                     <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">期望薪资</p>
                      <p className="font-medium">{profile.targetSalary || '面议'}</p>
                    </div>
                 </div>
                 <div className="mt-6">
                    <label className={`block w-full text-center py-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 text-indigo-600 font-medium mb-3 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                       {isUploading ? 'AI 解析中...' : '上传简历 (PDF) 自动更新'}
                       <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading}/>
                    </label>
                    <Button variant="outline" className="w-full" onClick={() => setIsEditModalOpen(true)}>手动编辑资料</Button>
                 </div>
              </div>
          </div>

          {/* Jobs Feed (Matches) */}
          <div className={`${activeTab === 'jobs' ? 'block' : 'hidden'} md:block`}>
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">精选机会</h2>
              <p className="text-slate-500 text-sm md:text-base">基于您的背景，为您甄选了以下高匹配度职位。</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1,2].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
                      <div className="h-24 bg-slate-100 rounded mb-4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {matches.map(({job, match}) => (
                  <div key={job.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                    {/* Exclusive Badge */}
                    {job.source === 'Exclusive' && (
                      <div className="absolute top-4 right-4 z-10">
                          <span className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-amber-200">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            独家
                          </span>
                      </div>
                    )}

                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                            </div>
                            <p className="text-base text-slate-600 font-medium">{job.company}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-5 text-sm">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{job.salaryRange}</span>
                          <span className="text-slate-500">{job.location}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-600 font-bold">{match.score}% 匹配</span>
                        </div>

                        {/* AI Reason Bubble - Simplified for Mobile */}
                        <div className="bg-indigo-50/50 rounded-xl p-4 mb-4 border border-indigo-50">
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-0.5">
                              <div className="h-5 w-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">AI</div>
                            </div>
                            <p className="text-sm text-indigo-900 leading-relaxed">
                              {match.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-md border border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                        {job.source === 'Crawler' ? (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">源自网络</span>
                            <a href={job.originalUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-slate-600 underline">
                              访问原网站
                            </a>
                          </div>
                        ) : (
                          <div className="flex-1"></div>
                        )}

                        <Button 
                          onClick={() => alert(job.source === 'Exclusive' ? '简历已投递' : '即将跳转至原网站')}
                          className={`flex-1 md:flex-none md:w-40 ${job.source === 'Exclusive' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                          {job.source === 'Exclusive' ? '一键投递' : '查看详情'}
                        </Button>
                    </div>
                  </div>
                ))}
                
                {matches.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-slate-500">暂无高匹配度推荐，Gemini 正在全网搜寻...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑我的简历">
         <div className="mb-4 text-center">
            <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
               {isUploading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>}
               {isUploading ? 'AI 正在分析简历...' : '重新上传 PDF 解析'}
               <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading}/>
            </label>
         </div>
         <CandidateForm 
            initialData={profile} 
            onSave={saveProfile} 
            onCancel={() => setIsEditModalOpen(false)} 
         />
      </Modal>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex flex-col items-center ${activeTab === 'jobs' ? 'text-slate-900' : 'text-slate-400'}`}
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
           <span className="text-[10px] font-bold mt-1">机会</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
           <span className="text-[10px] font-medium mt-1">进度</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-slate-900' : 'text-slate-400'}`}
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
           <span className="text-[10px] font-medium mt-1">我的</span>
        </button>
      </div>
    </div>
  );
};