import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { Button } from './Button';

interface CandidateFormProps {
  initialData: Partial<Candidate>;
  onSave: (data: Partial<Candidate>) => void;
  onCancel: () => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Candidate>>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (field: keyof Candidate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Split by comma and clean up
    const skills = e.target.value.split(/,|，/).map(s => s.trim()).filter(s => s);
    setFormData(prev => ({ ...prev, skills }));
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">姓名</label>
          <input 
            type="text" 
            value={formData.name || ''} 
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">当前职位</label>
          <input 
            type="text" 
            value={formData.title || ''} 
            onChange={e => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">经验年限 (年)</label>
          <input 
            type="number" 
            value={formData.experienceYears || ''} 
            onChange={e => handleChange('experienceYears', Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">最高学历</label>
          <input 
            type="text" 
            value={formData.education || ''} 
            onChange={e => handleChange('education', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="例：清华大学, 计算机硕士"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">当前薪资</label>
          <input 
            type="text" 
            value={formData.currentSalary || ''} 
            onChange={e => handleChange('currentSalary', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="例：80万"
          />
        </div>
         <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">期望薪资</label>
          <input 
            type="text" 
            value={formData.targetSalary || ''} 
            onChange={e => handleChange('targetSalary', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="例：120万"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">技能标签 (用逗号分隔)</label>
        <input 
          type="text" 
          value={formData.skills?.join(', ') || ''} 
          onChange={handleSkillsChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Java, Python, 架构设计, 团队管理"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">个人优势 / 简介</label>
        <textarea 
          value={formData.summary || ''} 
          onChange={e => handleChange('summary', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
        <Button variant="ghost" onClick={onCancel}>取消</Button>
        <Button onClick={() => onSave(formData)}>保存信息</Button>
      </div>
    </div>
  );
};