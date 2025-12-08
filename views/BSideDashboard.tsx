
import React, { useState, useEffect } from 'react';
import { Candidate, Job, MatchResult } from '../types';
import { DataService } from '../services/dataService';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Modal } from '../components/Modal';
import { CandidateForm } from '../components/CandidateForm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const BSideDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'talent' | 'jobs' | 'match'>('talent');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Upload & Edit State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate>>({});

  // Matching State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Load Data via DataService
  const refreshData = () => {
    setCandidates(DataService.getAllCandidates());
    setJobs(DataService.getAllJobs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          // Use DataService to handle logic
          const newCandidate = await DataService.uploadResume(base64Data, file.type);
          
          setEditingCandidate(newCandidate);
          setIsProcessing(false);
          setIsEditModalOpen(true);
        } catch (error) {
          console.error(error);
          setIsProcessing(false);
          alert('解析失败，请检查API Key或文件格式');
        }
      };
    } catch (e) {
      setIsProcessing(false);
      alert('文件读取错误');
    }
  };

  const saveNewCandidate = (data: Partial<Candidate>) => {
    if (data.id && data.name) {
       // Only save if it has ID (which it should from uploadResume)
       // We cast to Candidate because form validation should ideally handle required fields
       DataService.updateCandidateProfile(data as Candidate);
       refreshData();
       setIsEditModalOpen(false);
    }
  };

  const runMatching = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setActiveTab('match'); 
    setIsMatching(true);
    setMatches([]); 

    try {
      const results = await DataService.getMatchesForCandidate(candidateId, true); // Force fresh match
      setMatches(results);
    } catch (e) {
      console.error(e);
      alert('匹配服务暂时不可用');
    } finally {
      setIsMatching(false);
    }
  };

  const chartData = [
    { name: '待业', count: candidates.filter(c => c.status === '待业').length },
    { name: '面试中', count: candidates.filter(c => c.status === '面试中').length },
    { name: '已入职', count: candidates.filter(c => c.status === '已入职').length },
  ];

  const SkeletonRow = () => (
    <div className="animate-pulse flex items-center p-4 border-b border-slate-100">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/6"></div>
      </div>
      <div className="w-1/4 h-4 bg-slate-200 rounded mx-4"></div>
      <div className="w-1/4 h-4 bg-slate-200 rounded mx-4"></div>
      <div className="w-24 h-8 bg-slate-200 rounded"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Enterprise Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">职</div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900">职得 <span className="text-slate-400 font-normal">| 管理驾驶舱</span></h1>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-lg">
          {(['talent', 'jobs', 'match'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'talent' && '人才资产库'}
              {tab === 'jobs' && '岗位资源池'}
              {tab === 'match' && '智能匹配引擎'}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">HR</div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <Card className="p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
             <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">人才库总量</p>
               <p className="text-2xl font-bold text-slate-900">{candidates.length}</p>
             </div>
           </Card>
           <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
             <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">在招岗位</p>
               <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
             </div>
           </Card>
           <Card className="md:col-span-2 p-4 h-32 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={60} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </Card>
        </div>

        {activeTab === 'talent' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">人才资产库</h2>
              <div className="flex gap-3">
                 <label className={`cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20 font-medium text-sm ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isProcessing ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    )}
                    {isProcessing ? 'AI 解析中...' : '导入简历 (PDF)'}
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg" disabled={isProcessing} />
                 </label>
              </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">候选人信息</th>
                    <th className="px-6 py-4">教育背景</th>
                    <th className="px-6 py-4">经验年限</th>
                    <th className="px-6 py-4">技能标签</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isProcessing && (
                     <>
                      <tr><td colSpan={5} className="p-0"><SkeletonRow /></td></tr>
                      <tr><td colSpan={5} className="p-0"><SkeletonRow /></td></tr>
                     </>
                  )}
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                             {candidate.name?.charAt(0) || 'U'}
                           </div>
                           <div>
                             <div className="font-bold text-slate-900 text-base">{candidate.name}</div>
                             <div className="text-xs text-slate-500">{candidate.title}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800">
                           {candidate.education}
                         </span>
                      </td>
                      <td className="px-6 py-4">{candidate.experienceYears} 年</td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">{skill}</span>
                          ))}
                          {candidate.skills.length > 3 && <span className="text-xs text-slate-400 py-1">+{candidate.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => runMatching(candidate.id)}
                          className="group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200"
                        >
                          智能匹配
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
           <div className="space-y-6 animate-fadeIn">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">岗位资源池</h2>
              <div className="flex gap-3">
                 <Button variant="secondary" size="sm" className="shadow-md shadow-amber-500/20">
                   + 发布独家岗位
                 </Button>
                 <Button variant="outline" size="sm">
                   运行爬虫
                 </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <Card key={job.id} hoverEffect className={`flex flex-col h-full ${job.source === 'Exclusive' ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
                  <CardHeader 
                    title={job.title} 
                    subtitle={job.company} 
                    action={
                      job.source === 'Exclusive' ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          独家委托
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 font-medium border border-slate-200">
                          网络抓取
                        </span>
                      )
                    } 
                  />
                  <CardBody className="flex-1 flex flex-col gap-4">
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                         <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                         {job.location}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                         <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         {job.salaryRange}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-3 flex-1 leading-relaxed">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-50">
                      {job.tags.map(tag => (
                        <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{tag}</span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
           </div>
        )}

        {/* Match Tab */}
        {activeTab === 'match' && (
           <div className="flex gap-6 h-[calc(100vh-140px)] animate-fadeIn">
             {/* Left: Candidate Selector */}
             <Card className="w-1/3 flex flex-col overflow-hidden border-0 shadow-lg">
               <div className="p-4 border-b border-slate-100 bg-slate-50">
                 <h3 className="font-bold text-slate-800">选择候选人进行匹配</h3>
               </div>
               <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-white">
                 {candidates.map(c => (
                   <div 
                    key={c.id} 
                    onClick={() => runMatching(c.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedCandidateId === c.id ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-white border-transparent hover:bg-slate-50 border-slate-100'}`}
                   >
                     <div className="flex justify-between items-start mb-1">
                       <h4 className="font-bold text-slate-900">{c.name}</h4>
                       <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === '待业' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                         {c.status}
                       </span>
                     </div>
                     <p className="text-sm text-slate-500 mb-2">{c.title} • {c.experienceYears}年经验</p>
                     <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0,3).map(s => <span key={s} className="text-[10px] bg-white border border-slate-200 px-1.5 rounded text-slate-500">{s}</span>)}
                     </div>
                   </div>
                   
                 ))}
               </div>
             </Card>

             {/* Right: Matches */}
             <div className="w-2/3 flex flex-col gap-4">
                {isMatching ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative">
                      <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-indigo-400 opacity-25"></div>
                      <div className="relative rounded-full h-16 w-16 bg-indigo-600 flex items-center justify-center text-white">
                        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      </div>
                    </div>
                    <p className="mt-6 text-slate-500 font-medium">Gemini 正在分析人岗匹配度...</p>
                  </div>
                ) : matches.length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {matches.map((m, idx) => (
                      <Card key={m.jobId} className="border-0 shadow-md ring-1 ring-slate-100 overflow-visible">
                        <div className="p-6">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{m.jobDetails?.title}</h3>
                                <p className="text-slate-500">{m.jobDetails?.company}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-emerald-600">{m.score}%</div>
                                <div className="text-xs text-slate-400">匹配度</div>
                              </div>
                           </div>
                           
                           {/* Explainable AI Section */}
                           <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100 relative">
                             <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                               AI 推荐理由
                             </div>
                             <p className="text-sm text-slate-700 leading-relaxed">
                               {m.reason.split(new RegExp(`(${m.overlappingKeywords.join('|')})`, 'gi')).map((part, i) => 
                                 m.overlappingKeywords.some(k => k.toLowerCase() === part.toLowerCase()) 
                                   ? <span key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded mx-0.5 font-medium">{part}</span> 
                                   : part
                               )}
                             </p>
                           </div>

                           <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                              <span className="text-sm font-bold text-slate-900">{m.jobDetails?.salaryRange}</span>
                              <Button size="sm" onClick={() => alert('已推送给候选人微信')} className="bg-slate-900 text-white hover:bg-slate-800">
                                推送岗位
                              </Button>
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>请选择左侧候选人开始匹配</p>
                  </div>
                )}
             </div>
           </div>
        )}
      </main>

      {/* Candidate Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑候选人信息">
         <CandidateForm 
           initialData={editingCandidate} 
           onSave={saveNewCandidate} 
           onCancel={() => setIsEditModalOpen(false)} 
         />
      </Modal>
    </div>
  );
};
