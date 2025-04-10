fetch('track_visitor.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tracked: true })
})
.then(function (response) {
    console.log('Посетитель отслежен:', response);
})
.catch(function (error) {
    console.error('Ошибка при отслеживании посетителя:', error);
});