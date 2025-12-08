
import React, { useState } from 'react';
import { UserRole } from '../types';
import { DataService } from '../services/dataService';
import { Button } from '../components/Button';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

type AuthStep = 'selection' | 'login-b' | 'login-c';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('selection');

  const handleLoginSubmit = (role: UserRole) => {
    DataService.login(role); // Persist session
    onLogin(role);
  };

  // Step 1: Role Selection Landing View
  if (step === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col font-sans relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <header className="p-6 md:p-10 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">职</div>
            <h1 className="font-bold text-2xl tracking-tight text-slate-900">职得 <span className="font-light text-slate-500">ZhiDe</span></h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 z-10">
          <div className="text-center mb-12 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              高端人才<span className="text-indigo-600">精准</span>配置平台
            </h2>
            <p className="text-lg text-slate-600">
              请选择您的身份，开启高效的职业匹配之旅
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {/* B-Side Card */}
            <div 
              onClick={() => setStep('login-b')}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">我是招聘方</h3>
              <p className="text-slate-500 mb-6">猎头顾问 / 企业 HR</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-8 text-left w-full px-4">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>人才库批量管理</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>AI 智能人岗匹配</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>发布独家高端职位</li>
              </ul>
              <div className="mt-auto">
                <span className="text-indigo-600 font-medium group-hover:translate-x-1 inline-flex items-center transition-transform">
                  进入企业工作台 <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </span>
              </div>
            </div>

            {/* C-Side Card */}
             <div 
              onClick={() => setStep('login-c')}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                 <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">我是求职者</h3>
              <p className="text-slate-500 mb-6">高端人才 / 职业经理人</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-8 text-left w-full px-4">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>严格隐私保护</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>AI 简历智能解析</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>仅推荐高薪机会</li>
              </ul>
              <div className="mt-auto">
                <span className="text-amber-600 font-medium group-hover:translate-x-1 inline-flex items-center transition-transform">
                  探索机会 <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Step 2: Login Forms
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
         <button 
           onClick={() => setStep('selection')} 
           className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"
         >
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
           返回
         </button>

         <div className="text-center mb-8 mt-6">
           {step === 'login-b' ? (
             <>
               <h2 className="text-2xl font-bold text-slate-900">企业/猎头登录</h2>
               <p className="text-slate-500 text-sm mt-2">进入职得管理驾驶舱</p>
             </>
           ) : (
             <>
               <h2 className="text-2xl font-bold text-slate-900">高端人才登录</h2>
               <p className="text-slate-500 text-sm mt-2">发现您的下一个职业巅峰</p>
             </>
           )}
         </div>

         <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">账号 / 邮箱</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">密码</label>
              <input type="password" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="••••••••" />
            </div>
            <Button 
              onClick={() => handleLoginSubmit(step === 'login-b' ? UserRole.B_SIDE : UserRole.C_SIDE)} 
              className={`w-full h-12 text-base mt-4 ${step === 'login-c' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              立即登录
            </Button>
            
            <div className="text-center text-sm text-slate-400 mt-4">
              还没有账号？ <a href="#" className="text-indigo-600 hover:underline">立即注册</a>
            </div>
         </div>
       </div>
    </div>
  );
};
