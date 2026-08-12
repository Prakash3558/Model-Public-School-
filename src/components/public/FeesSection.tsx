import React from 'react';
import { motion } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { Card3DTilt } from '../common/Card3DTilt';
import { Info, ArrowRight } from 'lucide-react';

export const FeesSection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const feeList = settings?.grade_fees || [];

  return (
    <section id="fees" className="py-20 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="text-center max-w-3xl mx-auto mb-14 space-y-3"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Transparent Education
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading">
            <EditableText blockKey="fee.headline" defaultText="Class-wise Fee Structure (2026-27)" />
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <EditableText blockKey="fee.subtext" defaultText="High-quality education made accessible with transparent fee schedules and flexible installment plans." />
          </p>
        </div>

        {/* Modern Fee Table wrapped in 3D Card & Motion reveal */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card3DTilt maxTilt={5} scaleOnHover={1.01}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-heading">
                  <tr>
                    <th className="py-4 px-6 font-bold">Class / Grade</th>
                    <th className="py-4 px-6 font-bold">Admission Fee (One-Time)</th>
                    <th className="py-4 px-6 font-bold">Monthly Tuition Fee</th>
                    <th className="py-4 px-6 font-bold">Annual Development</th>
                    <th className="py-4 px-6 font-bold">Exam & Lab Charges</th>
                    <th className="py-4 px-6 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-body">
                  {feeList.map((f, idx) => (
                    <tr
                      key={f.id || idx}
                      className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        <EditableText blockKey={`fee.${f.id}.class`} defaultText={f.className} />
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                        ₹{f.admissionFee}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-blue-600 dark:text-blue-400">
                        ₹{f.monthlyTuition} / month
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        ₹{f.annualCharges}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        ₹{f.examFee}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href="#admissions"
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                        >
                          <span>Inquire</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card3DTilt>
        </motion.div>

        {/* Note Box */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300"
        >
          <Info className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Fee Payment Policy:</p>
            <p className="mt-0.5 leading-relaxed">
              Tuition fees are payable by the 10th of every month. Online fee payment is available via the Student & Parent Portal. Bus transport charges vary based on distance from Bhawanipur, Sikta campus.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
