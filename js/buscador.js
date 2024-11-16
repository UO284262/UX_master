$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search); //Obtenemos el término de la búsqueda
    const searchQuery = urlParams.get('q');
    const resultsContainer = $('#results');
    console.log("Término de búsqueda:", searchQuery); // Verificamos que el término de búsqueda se obtenga correctamente

    if (!searchQuery) { // Si no se ha introducido nada, lo solicita
        resultsContainer.html('Por favor ingresa un término de búsqueda.');
        return;
    }

    // Escapa caracteres especiales en el término de búsqueda
    const escapedQuery = escapeRegExp(searchQuery); //Ignoramos caracteres especiales

    if (escapedQuery.length < 4) { // Comprobamos que la búsqueda sea de al menos 4 caracteres
        resultsContainer.html('Introduce al menos 4 caracteres para la búsqueda.');
        return;
    }

    // Lista de páginas a buscar
    const pages = ['index.html', 'contacto.html', 'proyectos.html', 'series.html', 'books.html']; // Añadimos todas las páginas donde debe buscar
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

                // Buscar coincidencias en el contenido
                const matchSnippet = findClosestMatch(pageContent, escapedQuery);

                if (matchSnippet) {
                    matches.push({ page, match: matchSnippet });
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

    // Función para calcular la distancia de Levenshtein
    function levenshtein(a, b) {
        const matrix = [];

        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // Función para encontrar la coincidencia más cercana en el contenido
    function findClosestMatch(content, query) {
        const text = content; // Mantener el texto original para conservar mayúsculas y minúsculas
        const queryLower = query.toLowerCase();

        let closestMatch = null;
        let maxDistance = 1;

        for (let i = 0; i <= text.length - queryLower.length; i++) {
            let textToEvaluate = text.toLowerCase().substring(i, i + queryLower.length)
            let wordToEvaluate = textToEvaluate.split(" ").filter(item => item !== "");
            let wordInQuery = queryLower.split(" ")

            if (wordInQuery.length === wordToEvaluate.length) {
                let distance = 0
                for (let i = 0; i <= wordToEvaluate.length - 1; i++) {
                    distance += levenshtein(wordInQuery[i], wordToEvaluate[i])
                }
                if (distance <= maxDistance) {
                    closestMatch = text.slice(i, i + queryLower.length); // Obtener el texto original con mayúsculas y minúsculas
                    return getSnippet(text, text.indexOf(closestMatch), query, closestMatch);
                }
            }
        }
        if (closestMatch) {
            return getSnippet(text, text.indexOf(closestMatch), query);
        }
    }

    // Función para generar un fragmento del contenido alrededor de la coincidencia
    function getSnippet(content, startIndex, query, closestMatch) {
        const snippetLength = 150; // Longitud del fragmento a mostrar
        const start = Math.max(startIndex - snippetLength, 0);
        const end = Math.min(startIndex + snippetLength + query.length, content.length);
        let snippet = content.slice(start, end);

        // Resalta todas las coincidencias en el fragmento usando una función de reemplazo
        const highlightedQuery = new RegExp(escapeRegExp(closestMatch), 'gi');
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
