const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// مصفوفة حفظ تقييمات المقاولين
const contractorEvaluations = [];
// كود لجعل السيرفر يعرض صفحة الاستمارة مباشرة عند فتح الرابط الرئيسي
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.post('/api/submit-evaluation', (req, res) => {
    const { 
        projectName, contractNumber, contractorName,
        timeCommitment, qualityOfWork, techSpecs, 
        safetyCommitment, siteManagement, adminCommitment 
    } = req.body;

    // تحويل القيم إلى أرقام للتأكد من صحة الحسابات
    const scores = [
        Number(timeCommitment), 
        Number(qualityOfWork), 
        Number(techSpecs), 
        Number(safetyCommitment), 
        Number(siteManagement), 
        Number(adminCommitment)
    ];

    // حساب المجموع الكلي المستحق (الحد الأقصى هو 6 معايير × 5 درجات = 30)
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = 30;
    
    // حساب النسبة المئوية من 100%
    const finalPercentage = Math.round((totalScore / maxPossibleScore) * 100);

    // تحديد التوصية التلقائية بناءً على النسبة المئوية (مثلاً النجاح من 60%)
    const recommendation = finalPercentage >= 60 
        ? "يوصى بإصدار شهادة حسن تنفيذ للمقاول." 
        : "لا يوصى بإصدار شهادة حسن تنفيذ (الأداء دون المستوى المطلوب).";

    // معرف عشوائي للرابط
    const evalId = crypto.randomBytes(4).toString('hex');

    const newEvaluation = {
        id: evalId,
        projectName,
        contractNumber,
        contractorName,
        scores: {
            timeCommitment, qualityOfWork, techSpecs, 
            safetyCommitment, siteManagement, adminCommitment
        },
        totalScore,
        finalPercentage,
        recommendation,
        date: new Date().toLocaleDateString('ar-EG')
    };

    contractorEvaluations.push(newEvaluation);

    res.json({
        success: true,
        url: `https://serr-h7s1.onrender.com/api/evaluation/${evalId}`
    });
});

// صفحة عرض التقرير النهائي وحساب النسبة
app.get('/api/evaluation/:id', (req, res) => {
    const ev = contractorEvaluations.find(item => item.id === req.params.id);

    if (!ev) {
        return res.status(404).send('<h1>عذراً، التقييم غير موجود</h1>');
    }

    res.send(`
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 40px auto; padding: 30px; border: 2px solid #333; border-radius: 8px;">
            <h2 style="text-align: center; color: #0056b3;">تقرير تقييم أداء مقاول</h2>
            <p style="text-align: center;"><strong>التاريخ:</strong> ${ev.date}</p>
            <hr>
            <h3>أولاً: بيانات المشروع</h3>
            <p><strong>اسم المشروع:</strong> ${ev.projectName || 'غير مدخل'}</p>
            <p><strong>رقم العقد:</strong> ${ev.contractNumber || 'غير مدخل'}</p>
            <p><strong>المقاول المنفذ:</strong> ${ev.contractorName || 'غير مدخل'}</p>
            
            <hr>
            <h3>ثانياً: الدرجات المستحقة (من 1 إلى 5)</h3>
            <ul>
                <li>الالتزام بالبرنامج الزمني: <strong>${ev.scores.timeCommitment} / 5</strong></li>
                <li>جودة التنفيذ والأعمال المنجزة: <strong>${ev.scores.qualityOfWork} / 5</strong></li>
                <li>الالتزام بالمواصفات الفنية والمخططات: <strong>${ev.scores.techSpecs} / 5</strong></li>
                <li>الالتزام باشتراطات السلامة والصحة المهنية: <strong>${ev.scores.safetyCommitment} / 5</strong></li>
                <li>إدارة الموقع والتنسيق: <strong>${ev.scores.siteManagement} / 5</strong></li>
                <li>الالتزام الإداري والتعاقدي: <strong>${ev.scores.adminCommitment} / 5</strong></li>
            </ul>

            <hr style="border-top: 2px dashed #0056b3;">
            <div style="text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <h3>ثالثاً: التقييم العام والاحتساب الرقمي</h3>
                <p style="font-size: 24px; color: #28a745; margin: 5px 0;">
                    النتيجة النهائية: <strong>${ev.finalPercentage}%</strong>
                </p>
                <p>إجمالي النقاط: ${ev.totalScore} من أصل 30 نقطة</p>
            </div>

            <hr>
            <h3>رابعاً: التوصية النهائية</h3>
            <p style="font-weight: bold; color: ${ev.finalPercentage >= 60 ? 'green' : 'red'}; font-size: 18px;">
                📌 ${ev.recommendation}
            </p>
        </div>
    `);
});

app.listen(PORT, () => console.log(`السيرفر يعمل على منفذ: ${PORT}`));
