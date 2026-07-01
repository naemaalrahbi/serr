const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const contractorEvaluations = [];

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// حماية السكور من NaN
const safeScore = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
};

// إرسال التقييم
app.post('/api/submit-evaluation', (req, res) => {
    const {
        projectName,
        contractNumber,
        contractorName,
        engineerName,
        startDate,
        deliveryDate,
        timeCommitment,
        qualityOfWork,
        techSpecs,
        safetyCommitment,
        siteManagement,
        adminCommitment,
        aCommitment,
        bCommitment
    } = req.body;

    const scores = [
        safeScore(timeCommitment),
        safeScore(qualityOfWork),
        safeScore(techSpecs),
        safeScore(safetyCommitment),
        safeScore(siteManagement),
        safeScore(adminCommitment),
        safeScore(aCommitment),
        safeScore(bCommitment)
    ];

    const totalScore = scores.reduce((a, b) => a + b, 0);
    const finalPercentage = Math.round((totalScore / 40) * 100);

    const recommendation = finalPercentage >= 60
        ? "يوصى بإصدار شهادة حسن تنفيذ للمقاول."
        : "لا يوصى بإصدار شهادة حسن تنفيذ.";

    const evalId = crypto.randomBytes(4).toString('hex');

    const newEvaluation = {
        id: evalId,
        projectName,
        contractNumber,
        contractorName,
        engineerName,
        startDate,
        deliveryDate,
        scores,
        totalScore,
        finalPercentage,
        recommendation,
        date: new Date().toLocaleDateString('ar-EG')
    };

    contractorEvaluations.push(newEvaluation);

    const baseUrl = req.protocol + '://' + req.get('host');

    res.json({
        success: true,
        url: `${baseUrl}/api/evaluation/${evalId}`
    });
});

// صفحة التقرير + الرسم البياني
app.get('/api/evaluation/:id', (req, res) => {
    const ev = contractorEvaluations.find(x => x.id === req.params.id);

    if (!ev) {
        return res.status(404).send("<h1>التقييم غير موجود</h1>");
    }

    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير التقييم</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body{
    font-family: Arial;
    background:#f4f6f9;
    padding:20px;
}
.container{
    max-width:800px;
    margin:auto;
    background:white;
    padding:20px;
    border-radius:10px;
}
h2{color:#0056b3;text-align:center;}
</style>
</head>

<body>

<div class="container">
<h2>📊 تقرير تقييم المقاول</h2>

<p><b>المشروع:</b> ${ev.projectName}</p>
<p><b>المقاول:</b> ${ev.contractorName}</p>
<p><b>النسبة:</b> ${ev.finalPercentage}%</p>

<canvas id="chart"></canvas>

<p style="color:${ev.finalPercentage >= 60 ? 'green' : 'red'};font-size:18px;">
${ev.recommendation}
</p>
</div>

<script>
const ctx = document.getElementById('chart');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [
            "الزمني",
            "الجودة",
            "المواصفات",
            "السلامة",
            "إدارة الموقع",
            "الإداري",
            "الإدارة",
            "الاستجابة"
        ],
        datasets: [{
            label: "درجات التقييم",
            data: ${JSON.stringify(ev.scores)},
            backgroundColor: [
                "#ff6384",
                "#36a2eb",
                "#ffce56",
                "#4bc0c0",
                "#9966ff",
                "#ff9f40",
                "#2ecc71",
                "#e74c3c"
            ],
            borderRadius: 5
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                max: 5
            }
        }
    }
});
</script>

</body>
</html>
    `);
});

app.listen(PORT, () => console.log("Server running on " + PORT));app.listen(PORT, () => console.log(`السيرفر يعمل على منفذ: ${PORT}`));
