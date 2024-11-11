$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const resultsContainer = $('#results');
    console.log("Término de búsqueda:", searchQuery); // Verifica que el término de búsqueda se obtenga correctamente

    if (!searchQuery) {
        resultsContainer.html('Por favor ingresa un término de búsqueda.');
        return;
    }

    // Escapa caracteres especiales en el término de búsqueda
    const escapedQuery = escapeRegExp(searchQuery);

    // Lista de páginas a buscar
    const pages = ['index.html', 'contacto.html', 'proyectos.html', 'series.html', 'books.html']; // Añadir todas tus páginas HTML aquí
    let matches = [];
    let completedRequests = 0;

    // Hacer las peticiones AJAX para cada página
    $.each(pages, function (index, page) {
        $.ajax({
            url: page,
            method: 'GET',
            success: function (content) {
                console.log(`Contenido de ${page}:`, content); // Verifica que el contenido se cargue correctamente

                // Crear un elemento temporal para manejar el contenido HTML y extraer solo el texto visible
                const tempDiv = $('<div>').html(content);

                // Aquí buscamos todo el contenido de la página si no tienes un contenedor específico
                const pageContent = tempDiv.find('main *:not(script):not(style)').text(); // Extrae todo el texto visible de la página

                console.log(`Contenido procesado de ${page}:`, pageContent); // Imprime el contenido de la página procesado

                // Buscar solo una coincidencia en el contenido
                const firstMatchSnippet = findFirstMatch(pageContent, escapedQuery);

                if (firstMatchSnippet) {
                    matches.push({ page, match: firstMatchSnippet });
                }

                completedRequests++;

                // Una vez que todas las páginas han sido procesadas, mostrar los resultados
                if (completedRequests === pages.length) {
                    displayResults(matches, searchQuery);
                }
            },
            error: function (error) {
                console.log('Error al cargar la página: ', error);
            }
        });
    });

    // Función para escapar caracteres especiales en la expresión regular
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiales
    }

    // Función para encontrar solo la primera coincidencia en el contenido
    function findFirstMatch(content, query) {
        const regex = new RegExp(query, 'i'); // Buscar la primera coincidencia (sin distinguir mayúsculas y minúsculas)
        const match = regex.exec(content);

        if (match) {
            return getSnippet(content, match.index, query);
        }
        return null;
    }

    // Función para generar un fragmento del contenido alrededor de la coincidencia
    function getSnippet(content, startIndex, query) {
        const snippetLength = 150; // Longitud del fragmento a mostrar
        const start = Math.max(startIndex - snippetLength, 0);
        const end = Math.min(startIndex + snippetLength + query.length, content.length);
        let snippet = content.slice(start, end);

        // Resalta todas las coincidencias en el fragmento usando una función de reemplazo
        const highlightedQuery = new RegExp(query, 'gi');
        snippet = snippet.replace(highlightedQuery, (match) => `<strong>${match}</strong>`);

        return snippet;
    }

    // Función para mostrar los resultados de la búsqueda
    function displayResults(matches, query) {
        if (matches.length === 0) {
            resultsContainer.html('No se encontraron resultados para "' + query + '".');
        } else {
            let resultList = '<ul>';
            $.each(matches, function (index, match) {
                const pageName = match.page.split('.')[0]; // Nombre de la página sin extensión
                resultList += `
                    <li>
                        <a href="${match.page}" title="Ir a ${pageName}">${pageName}</a>
                        <p>${match.match}</p> <!-- Mostrar solo el primer fragmento de coincidencia -->
                    </li>
                `;
            });
            resultList += '</ul>';
            resultsContainer.html(resultList); // Usando .html() para interpretar etiquetas HTML
        }
    }
});
