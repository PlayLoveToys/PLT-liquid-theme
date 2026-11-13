document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', function() {
      this.classList.toggle('active');
      answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });
});