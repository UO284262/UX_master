$(document).ready(function () {
    $('#searchForm').submit(function (event) {
        event.preventDefault(); // Prevenir el envío del formulario
        const query = $('#searchInput').val();
        window.location.href = `searchResults.html?q=${encodeURIComponent(query)}`; // Redirige con el query
    });
});