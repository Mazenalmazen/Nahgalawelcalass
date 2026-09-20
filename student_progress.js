/* ==========================================================================
   نظام تقييم ومتابعة الطلاب - منصة نهج الأوائل
   ========================================================================== */

function calculateStudentData(studentName) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');

    if (!studentName) studentName = localStorage.getItem('studentName') || '';

    let examsData = [];
    let totalObtained = 0;
    let totalMax = 0;
    let totalAttempts = 0;
    let completedExams = 0;
    let bestGrade = 0;
    let worstGrade = 100;

    savedExams.forEach(exam => {
        let gradesData = studentGrades[exam.exam_number];
        if (!gradesData) return;

        let attempts = [];
        if (Array.isArray(gradesData)) attempts = gradesData;
        else if (typeof gradesData === 'string') attempts = [{ grade: gradesData, obtained: 0, total: 0, date: null, attempt: 1 }];

        if (attempts.length === 0) return;
        totalAttempts += attempts.length;

        let bestAttempt = attempts.reduce((best, curr) => {
            let bestPct = (best.total && best.total > 0) ? (best.obtained / best.total) : 0;
            let currPct = (curr.total && curr.total > 0) ? (curr.obtained / curr.total) : 0;
            return currPct > bestPct ? curr : best;
        }, attempts[0]);

        let obtained = bestAttempt.obtained || 0;
        let max = bestAttempt.total || 0;
        let pct = max > 0 ? (obtained / max) * 100 : 0;

        totalObtained += obtained;
        totalMax += max;
        completedExams++;

        if (pct > bestGrade) bestGrade = pct;
        if (pct < worstGrade) worstGrade = pct;

        examsData.push({
            examNumber: exam.exam_number,
            examName: exam.exam_name,
            attempts: attempts.length,
            bestGrade: bestAttempt.grade,
            bestObtained: obtained,
            bestTotal: max,
            bestPct: pct,
            allAttempts: attempts
        });
    });

    let overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    return { studentName, examsData, totalObtained, totalMax, overallPct, totalAttempts, completedExams, bestGrade, worstGrade: worstGrade === 100 ? 0 : worstGrade };
}

function calculateStrengthsWeaknesses(studentData) {
    let strengths = [];
    let weaknesses = [];
    studentData.examsData.forEach(exam => {
        if (exam.bestPct >= 85) strengths.push({ name: exam.examName, pct: exam.bestPct, grade: exam.bestGrade });
        else if (exam.bestPct < 60) weaknesses.push({ name: exam.examName, pct: exam.bestPct, grade: exam.bestGrade });
    });
    return { strengths, weaknesses };
}

function calculateMotivationPoints(studentData) {
    let points = 0;
    let badges = [];

    points += studentData.completedExams * 10;
    points += studentData.totalAttempts * 5;

    if (studentData.totalAttempts >= 5) { badges.push({ icon: '🔥', name: 'المثابر', color: '#14b8a6', bg: '#f0fdfa' }); points += 20; }
    if (studentData.bestGrade >= 90) { badges.push({ icon: '🌟', name: 'المتفوق', color: '#06b6d4', bg: '#ecfeff' }); points += 30; }
    if (studentData.bestGrade >= 98) { badges.push({ icon: '👑', name: 'المتقن', color: '#0891b2', bg: '#f0fdfa' }); points += 50; }
    if (studentData.completedExams >= 3) { badges.push({ icon: '📚', name: 'المشارك', color: '#0e7490', bg: '#ecfeff' }); points += 15; }
    if (studentData.overallPct >= 80) { badges.push({ icon: '🏆', name: 'المتميز', color: '#0d9488', bg: '#f0fdfa' }); points += 25; }

    return { points, badges };
}

function getMotivationLevel(points) {
    if (points >= 200) return { level: 'خبير', color: '#0891b2', gradient: 'linear-gradient(135deg, #67e8f9, #06b6d4)', icon: '💎', next: null };
    if (points >= 150) return { level: 'متقدم', color: '#0e7490', gradient: 'linear-gradient(135deg, #5eead4, #14b8a6)', icon: '🚀', next: 200 };
    if (points >= 100) return { level: 'متوسط', color: '#14b8a6', gradient: 'linear-gradient(135deg, #7dd3fc, #38bdf8)', icon: '⭐', next: 150 };
    if (points >= 50) return { level: 'مبتدئ', color: '#0d9488', gradient: 'linear-gradient(135deg, #99f6e4, #5eead4)', icon: '🌱', next: 100 };
    return { level: 'مستكشف', color: '#0f766e', gradient: 'linear-gradient(135deg, #ccfbf1, #99f6e4)', icon: '🔍', next: 50 };
}

function getMotivationalMessage(pct, examsCount) {
    if (examsCount === 0) return 'لم تخض أي اختبار بعد. ابدأ رحلتك التعليمية الآن! 🌟';
    if (pct >= 95) return 'أداء استثنائي! أنت من نخبة الطلاب. واصل هذا التميز! 🏆';
    if (pct >= 85) return 'أداء ممتاز! القليل من الجهد الإضافي وسنصل إلى 100%! 🚀';
    if (pct >= 70) return 'أداء جيد جداً! ركز على المراجعة وستحقق نتائج مبهرة! ⭐';
    if (pct >= 50) return 'أداء جيد! حدد نقاط الضعف واعمل عليها! 💪';
    return 'لا تقلق، البداية دائماً صعبة. راجع الدروس ولا تستسلم! 🌱';
}

/* ==================== رسم بطاقة التقييم ==================== */
function renderStudentEvaluation() {
    console.log('🎨 [رسم] بدء رسم البطاقة');

    let studentName = localStorage.getItem('studentName') || '';

    if (!studentName) {
        studentName = prompt('الرجاء إدخال اسمك لعرض بطاقة التقييم:');
        if (studentName) localStorage.setItem('studentName', studentName);
    }

    if (!studentName) {
        var content = document.getElementById('student_evaluation_content');
        if (content) content.innerHTML = '<p style="text-align:center; color:#64748b; font-weight:900;">لم يتم تحديد اسم الطالب بعد.</p>';
        return;
    }

    let data = calculateStudentData(studentName);
    let { strengths, weaknesses } = calculateStrengthsWeaknesses(data);
    let { points, badges } = calculateMotivationPoints(data);
    let level = getMotivationLevel(points);

    let html = `
    <div style="
        background: linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 25%, #e0f7fa 50%, #f0fdfa 100%);
        border-radius: 22px;
        padding: 22px;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        font-weight: 900;
        position: relative;
        overflow: hidden;
        border: 2px solid #99f6e4;
    ">
        <div style="position:absolute; top:-40px; left:-40px; width:200px; height:200px; background:radial-gradient(circle, rgba(94,234,212,0.25) 0%, transparent 70%); border-radius:50%;"></div>
        <div style="position:absolute; top:30%; right:-60px; width:220px; height:220px; background:radial-gradient(circle, rgba(125,211,252,0.20) 0%, transparent 70%); border-radius:50%;"></div>

        <div style="
            position: relative;
            background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%);
            border-radius: 18px;
            padding: 24px 20px;
            text-align: center;
            color: #fff;
            box-shadow: 0 12px 35px rgba(20,184,166,0.30);
            margin-bottom: 20px;
            overflow: hidden;
        ">
            <div style="position:absolute; top:-30px; right:-30px; width:140px; height:140px; background:rgba(255,255,255,0.22); border-radius:50%;"></div>
            <div style="position:absolute; bottom:-50px; left:-20px; width:170px; height:170px; background:rgba(255,255,255,0.15); border-radius:50%;"></div>
            
            <div style="position:relative; z-index:1;">
                <div style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    width:75px;
                    height:75px;
                    background: rgba(255,255,255,0.35);
                    border: 3px solid rgba(255,255,255,0.65);
                    border-radius: 50%;
                    font-size: 2.3rem;
                    margin-bottom: 10px;
                ">${level.icon}</div>
                <h3 style="margin:0 0 10px 0; color:#fff; font-size:1.4rem; font-weight:900; text-shadow:0 2px 6px rgba(0,0,0,0.25);">${data.studentName}</h3>
                <div style="
                    display:inline-block;
                    background: rgba(255,255,255,0.4);
                    border: 1.5px solid rgba(255,255,255,0.6);
                    padding: 6px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 900;
                ">
                    <i class="fas fa-star"></i> مستوى ${level.level}
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:20px; position:relative; z-index:1;">
            <div style="background: linear-gradient(145deg, #ffffff, #f0fdfa); border: 2px solid #5eead4; border-radius: 16px; padding: 14px 8px; text-align: center;">
                <div style="font-size:1.8rem; font-weight:900; color:#0d9488; line-height:1;">${data.completedExams}</div>
                <div style="font-size:0.75rem; color:#115e59; font-weight:900; margin-top:6px;">اختبار مكتمل</div>
            </div>
            <div style="background: linear-gradient(145deg, #ffffff, #ecfeff); border: 2px solid #67e8f9; border-radius: 16px; padding: 14px 8px; text-align: center;">
                <div style="font-size:1.8rem; font-weight:900; color:#0891b2; line-height:1;">${data.overallPct.toFixed(0)}</div>
                <div style="font-size:0.75rem; color:#155e75; font-weight:900; margin-top:6px;">المتوسط العام</div>
            </div>
            <div style="background: linear-gradient(145deg, #ffffff, #f0fdfa); border: 2px solid #5eead4; border-radius: 16px; padding: 14px 8px; text-align: center;">
                <div style="font-size:1.8rem; font-weight:900; color:#0f766e; line-height:1;">${points}</div>
                <div style="font-size:0.75rem; color:#115e59; font-weight:900; margin-top:6px;">نقاط التحفيز</div>
            </div>
        </div>
    `;

    if (level.next) {
        let currentMin = level.next === 50 ? 0 : level.next === 100 ? 50 : level.next === 150 ? 100 : 150;
        let progress = ((points - currentMin) / (level.next - currentMin)) * 100;
        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;

        html += `
        <div style="background: #ffffff; border: 2px solid #99f6e4; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:900; color:#0f766e; margin-bottom:8px;">
                <span><i class="fas fa-rocket"></i> التقدم للمستوى التالي</span>
                <span>${points} / ${level.next}</span>
            </div>
            <div style="background:#ccfbf1; border-radius:20px; height:14px; overflow:hidden;">
                <div style="background: ${level.gradient}; height:100%; width:${progress}%; border-radius:20px;"></div>
            </div>
            <p style="margin:8px 0 0 0; font-size:0.75rem; color:#0d9488; text-align:center; font-weight:900;">
                تحتاج ${level.next - points} نقطة للمستوى التالي 🎯
            </p>
        </div>
        `;
    }

    if (badges.length > 0) {
        html += `
        <div style="background: #ffffff; border: 2px solid #99f6e4; border-radius: 18px; padding: 18px; margin-bottom: 20px;">
            <h4 style="color:#0d9488; margin:0 0 14px 0; font-size:1.05rem; font-weight:900;">
                <i class="fas fa-medal"></i> الشارات المكتسبة (${badges.length})
            </h4>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
        `;
        badges.forEach(b => {
            html += `<div style="background: ${b.bg}; border: 2px solid ${b.color}50; border-radius: 14px; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size:1.5rem;">${b.icon}</span>
                <span style="font-weight:900; color:${b.color}; font-size:0.9rem;">${b.name}</span>
            </div>`;
        });
        html += `</div></div>`;
    }

    // نقاط القوة
    html += `<div style="background: #ffffff; border: 2px solid #5eead4; border-radius: 18px; padding: 18px; margin-bottom: 16px;">
        <h4 style="color:#0d9488; margin:0 0 14px 0; font-size:1.05rem; font-weight:900;">
            <i class="fas fa-arrow-up"></i> نقاط القوة
        </h4>`;

    if (strengths.length > 0) {
        strengths.forEach(s => {
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:8px; background:#f0fdfa; border-radius:12px; border:1.5px solid #a7f3d0;">
                <span style="font-weight:900; color:#115e59; font-size:0.9rem;"><i class="fas fa-check" style="color:#0d9488; margin-left:6px;"></i>${s.name}</span>
                <span style="background:linear-gradient(135deg,#5eead4,#14b8a6); color:#fff; padding:5px 14px; border-radius:20px; font-size:0.8rem; font-weight:900;">${s.pct.toFixed(0)}%</span>
            </div>`;
        });
    } else {
        html += `<div style="text-align:center; padding:18px; background:#f0fdfa; border-radius:12px; border:1.5px dashed #5eead4; color:#0d9488; font-size:0.9rem; font-weight:900;">
            <i class="fas fa-seedling" style="font-size:1.5rem; display:block; margin-bottom:6px;"></i>
            لم تسجل نقاط قوة بعد. استمر في أداء الاختبارات!
        </div>`;
    }
    html += `</div>`;

    // نقاط تحتاج تطوير
    if (weaknesses.length > 0) {
        html += `<div style="background: #ffffff; border: 2px solid #fed7aa; border-radius: 18px; padding: 18px; margin-bottom: 16px;">
            <h4 style="color:#c2410c; margin:0 0 14px 0; font-size:1.05rem; font-weight:900;">
                <i class="fas fa-arrow-down"></i> نقاط تحتاج تطوير
            </h4>`;
        weaknesses.forEach(w => {
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:8px; background:#fff7ed; border-radius:12px; border:1.5px solid #fed7aa;">
                <span style="font-weight:900; color:#9a3412; font-size:0.9rem;"><i class="fas fa-exclamation-circle" style="color:#ea580c; margin-left:6px;"></i>${w.name}</span>
                <span style="background:linear-gradient(135deg,#fb923c,#c2410c); color:#fff; padding:5px 14px; border-radius:20px; font-size:0.8rem; font-weight:900;">${w.pct.toFixed(0)}%</span>
            </div>`;
        });
        html += `<div style="background:#fffbeb; border:2px solid #fde68a; border-radius:12px; padding:12px 14px; margin-top:10px; font-size:0.88rem; color:#92400e; font-weight:900;">
            <i class="fas fa-lightbulb" style="color:#f59e0b;"></i> <b>نصيحة:</b> ركز على مراجعة الدروس التي حصلت فيها على درجات أقل.
        </div></div>`;
    }

    // رصد التطور
    if (data.examsData.length > 0) {
        html += `<div style="background: #ffffff; border: 2px solid #a5f3fc; border-radius: 18px; padding: 18px; margin-bottom: 16px;">
            <h4 style="color:#0891b2; margin:0 0 14px 0; font-size:1.05rem; font-weight:900;">
                <i class="fas fa-chart-line"></i> رصد تطور الدرجات
            </h4>`;
        data.examsData.forEach(exam => {
            let barColor = exam.bestPct >= 80 ? 'linear-gradient(90deg,#5eead4,#14b8a6)' : exam.bestPct >= 60 ? 'linear-gradient(90deg,#7dd3fc,#0891b2)' : 'linear-gradient(90deg,#fb923c,#c2410c)';
            html += `<div style="display:flex; align-items:center; margin-bottom:12px; gap:10px; background:#ecfeff; padding:10px; border-radius:12px; border:1.5px solid #cffafe;">
                <span style="font-size:0.78rem; font-weight:900; color:#155e75; min-width:80px; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${exam.examName}">${exam.examName.substring(0, 12)}${exam.examName.length > 12 ? '…' : ''}</span>
                <div style="flex:1; background:#f0fdfa; border-radius:20px; height:24px; overflow:hidden;">
                    <div style="background:${barColor}; height:100%; width:${exam.bestPct}%; border-radius:20px; display:flex; align-items:center; justify-content:flex-end; padding-left:8px;">
                        <span style="font-size:0.75rem; font-weight:900; color:#fff;">${exam.bestPct.toFixed(0)}%</span>
                    </div>
                </div>
                <span style="font-size:0.78rem; font-weight:900; color:#0f172a; min-width:48px; text-align:center; background:#f0fdfa; padding:4px 6px; border-radius:6px; border:1.5px solid #99f6e4;">${exam.bestGrade}</span>
            </div>`;
        });
        html += `</div>`;
    }

    // رسالة تحفيزية
    html += `<div style="background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 50%, #5eead4 100%); border: 2px solid #2dd4bf; border-radius: 18px; padding: 22px; text-align: center; margin-bottom: 16px;">
        <div style="font-size:1.9rem; margin-bottom:10px;">💪</div>
        <p style="margin:0; font-weight:900; color:#115e59; font-size:0.98rem; line-height:1.7;">${getMotivationalMessage(data.overallPct, data.completedExams)}</p>
    </div>`;

    // ضع محتوى البطاقة داخل الحاوية
    var content = document.getElementById('student_evaluation_content');
    if (content) content.innerHTML = html;

    console.log('✅ [رسم] تم رسم البطاقة بنجاح');
}

/* تعريف الدوال عالمياً */
window.renderStudentEvaluation = renderStudentEvaluation;

console.log('✅ [تحميل] student_progress.js محمّل بنجاح');