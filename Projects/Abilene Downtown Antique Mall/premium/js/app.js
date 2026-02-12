// Parallax hero effect
const hero = document.getElementById('hero');
if(hero){
  window.addEventListener('scroll',()=>{
    const offset = window.pageYOffset;
    hero.style.backgroundPositionY = offset * 0.5 + 'px';
  });
}

// Simple accordion for FAQs
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(btn=>{
  btn.addEventListener('click',()=>{
    const answer = btn.nextElementSibling;
    answer.style.display = answer.style.display==='block'?'none':'block';
  });
});

// Placeholder: Fetch dealer data
// fetch('/data/dealers.json').then(r=>r.json()).then(data=>{ /* populate dealer grid */ });
