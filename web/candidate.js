const dialog = document.querySelector('#candidate-dialog');
let language = 'th';

function showDetail(thTitle, enTitle, thDetail, enDetail) {
  document.querySelector('#candidate-title').textContent = language === 'th' ? thTitle : enTitle;
  document.querySelector('#candidate-detail').textContent = language === 'th' ? thDetail : enDetail;
  dialog.showModal();
}

document.querySelector('#language-toggle').addEventListener('click', event => {
  language = language === 'th' ? 'en' : 'th';
  document.documentElement.lang = language;
  event.currentTarget.classList.toggle('english', language === 'en');
  document.querySelectorAll('[data-th][data-en]').forEach(element => {
    element.textContent = element.dataset[language];
  });
});

document.querySelector('#upload-training').addEventListener('click', () => {
  showDetail('หลักฐานการอบรม', 'Training evidence',
    'เตรียมใบรับรองการอบรมรถยกเพื่อให้พี่เลี้ยงตรวจสอบ หน้านี้เป็นเดโมและไม่มีการรับเอกสาร',
    'Prepare your forklift training certificate for your coach to check. This demo does not accept documents.');
});

document.querySelectorAll('.save-job').forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.setAttribute('aria-pressed', String(saved));
    button.textContent = saved ? '♥' : '♡';
  });
});

document.querySelector('#appointment-detail').addEventListener('click', () => {
  showDetail('นัดหมายตัวอย่าง', 'Sample appointment',
    '12 พ.ย. เวลา 10:30 น. เตรียมสัมภาษณ์กับคุณเมย์ที่ CARE บางนา',
    '12 Nov at 10:30. Interview preparation with May at CARE Bang Na.');
});

document.querySelector('#privacy-manage').addEventListener('click', () => {
  showDetail('ข้อมูลที่แชร์ในเดโม', 'Information shared in this demo',
    'Acme Logistics เห็นชื่อผู้สมัคร สถานะยืนยันตัวตน และสถานะการอบรม ทั้งสามรายการเป็นข้อมูลจำลอง',
    'Acme Logistics can see the applicant name, identity verification status, and training status. All three items are synthetic.');
});

document.querySelector('#contact-coach').addEventListener('click', () => {
  showDetail('พี่เลี้ยงในเดโม', 'Demo support coach',
    'คุณเมย์เป็นพี่เลี้ยงในเคสตัวอย่าง ปุ่มนี้แสดงข้อมูลประกอบการสาธิต',
    'May is the support coach in this sample case. This button shows demo information.');
});
