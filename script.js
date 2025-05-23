document.addEventListener('DOMContentLoaded', () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const canvas = document.getElementById('drawingCanvas');
    const togglePointsButton = document.getElementById('togglePoints');
    const lineColorInput = document.getElementById('lineColor');
    const fillColorInput = document.getElementById('fillColor');
    const bgColorInput = document.getElementById('bgColor');
    const setBackgroundButton = document.getElementById('setBackground');
    const startPolygonButton = document.getElementById('startPolygon');
    const fillPolygonButton = document.getElementById('fillPolygon');
    const gridRowsInput = document.getElementById('gridRows');
    const gridColsInput = document.getElementById('gridCols');
    const updateGridButton = document.getElementById('updateGrid');

    let currentGridRows = 5;
    let currentGridCols = 5;
    let cellSize; // Will be calculated in createGrid

    const pointRadius = 5;
    const canvasPadding = 40; // Padding around the grid

    let pointsVisible = true;
    let gridPoints = [];
    let selectedPointsForLine = [];
    let currentPolygonPoints = [];
    let isDrawingPolygon = false;

    // --- Grid Generation ---
    function createGrid() {
        canvas.innerHTML = ''; // Clear previous points and lines if any (for potential future redraws)
        gridPoints = [];
        selectedPointsForLine = []; // Reset selected points
        currentPolygonPoints = []; // Reset polygon points

        const N_rows = parseInt(gridRowsInput.value);
        const N_cols = parseInt(gridColsInput.value);
        currentGridRows = N_rows > 1 ? N_rows : 2; // Ensure at least 2
        currentGridCols = N_cols > 1 ? N_cols : 2; // Ensure at least 2

        // Recalculate cellSize based on new dimensions
        const availableWidth = canvas.width.baseVal.value - 2 * canvasPadding;
        const availableHeight = canvas.height.baseVal.value - 2 * canvasPadding;
        
        const cellWidth = availableWidth / (currentGridCols - 1);
        const cellHeight = availableHeight / (currentGridRows - 1);
        cellSize = Math.min(cellWidth, cellHeight); // Use the smaller of the two

        for (let i = 0; i < currentGridRows; i++) {
            for (let j = 0; j < currentGridCols; j++) {
                const x = canvasPadding + j * cellSize;
                const y = canvasPadding + i * cellSize;
                
                const point = document.createElementNS(svgNS, 'circle');
                point.setAttribute('cx', x);
                point.setAttribute('cy', y);
                point.setAttribute('r', pointRadius);
                point.setAttribute('class', 'grid-point');
                point.dataset.id = `${i}-${j}`; // Unique ID for the point

                point.addEventListener('click', () => handlePointClick(point, x, y));
                
                canvas.appendChild(point);
                gridPoints.push({ x, y, element: point });
            }
        }
        updatePointVisibility();
    }

    function updatePointVisibility() {
        gridPoints.forEach(p => {
            p.element.style.display = pointsVisible ? '' : 'none';
        });
    }

    // --- Point Click Handling ---
    function handlePointClick(pointElement, x, y) {
        if (isDrawingPolygon) {
            // Check if the point is already in the current polygon path
            const alreadySelected = currentPolygonPoints.find(p => p.x === x && p.y === y);
            if (alreadySelected && currentPolygonPoints.length > 2 && currentPolygonPoints[0].x === x && currentPolygonPoints[0].y === y) {
                // Clicked on the first point again to close the polygon
                console.log("Polygon closed by clicking start point.");
                // No automatic fill here, user clicks "Fill Polygon" button
            } else if (!alreadySelected) {
                currentPolygonPoints.push({ x, y, element: pointElement });
                pointElement.style.fill = 'blue'; // Highlight selected polygon points
                console.log("Point added to polygon: ", currentPolygonPoints);
            }
        } else {
            // Line drawing logic
            selectedPointsForLine.push({ x, y, element: pointElement });
            pointElement.style.fill = 'red'; // Highlight selected line points

            if (selectedPointsForLine.length === 2) {
                drawLine(selectedPointsForLine[0], selectedPointsForLine[1]);
                selectedPointsForLine.forEach(p => p.element.style.fill = ''); // Reset color
                selectedPointsForLine = [];
            }
        }
    }

    // --- Line Drawing ---
    function drawLine(p1, p2) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', lineColorInput.value);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('class', 'grid-line');
        
        // Insert line before the points so points are clickable on top
        if (canvas.firstChild) {
            canvas.insertBefore(line, canvas.firstChild);
        } else {
            canvas.appendChild(line);
        }
        console.log(`Line drawn from (${p1.x},${p1.y}) to (${p2.x},${p2.y})`);
    }

    // --- Polygon Filling ---
    startPolygonButton.addEventListener('click', () => {
        isDrawingPolygon = !isDrawingPolygon;
        if (isDrawingPolygon) {
            startPolygonButton.textContent = 'End Polygon';
            currentPolygonPoints = []; // Reset for new polygon
            // Reset visual cues for line drawing if any
            selectedPointsForLine.forEach(p => p.element.style.fill = '');
            selectedPointsForLine = [];
            console.log("Started drawing polygon mode.");
        } else {
            startPolygonButton.textContent = 'Start Polygon';
            // Points remain highlighted blue until fill or cancelled
            console.log("Ended drawing polygon mode. Points selected: ", currentPolygonPoints.length);
        }
    });

    fillPolygonButton.addEventListener('click', () => {
        if (!isDrawingPolygon && currentPolygonPoints.length > 2) {
            const polygon = document.createElementNS(svgNS, 'polygon');
            const pointsString = currentPolygonPoints.map(p => `${p.x},${p.y}`).join(' ');
            polygon.setAttribute('points', pointsString);
            polygon.setAttribute('fill', fillColorInput.value);
            polygon.setAttribute('class', 'filled-polygon');
            
            // Insert polygon before lines and points
            if (canvas.firstChild) {
                canvas.insertBefore(polygon, canvas.firstChild);
            } else {
                canvas.appendChild(polygon);
            }
            console.log("Polygon filled with points: ", pointsString);

            // Reset polygon state
            currentPolygonPoints.forEach(p => p.element.style.fill = ''); // Reset highlight
            currentPolygonPoints = [];
        } else if (currentPolygonPoints.length <= 2) {
            alert("Please select at least 3 points to form a polygon.");
        } else if (isDrawingPolygon) {
            alert("Please end polygon selection before filling.");
        }
    });
    

    // --- UI Controls ---
    togglePointsButton.addEventListener('click', () => {
        pointsVisible = !pointsVisible;
        updatePointVisibility();
    });

    setBackgroundButton.addEventListener('click', () => {
        canvas.style.backgroundColor = bgColorInput.value;
    });

    // --- Initial Setup ---
    gridRowsInput.value = currentGridRows;
    gridColsInput.value = currentGridCols;
    createGrid();

    // --- UI Control Event Listeners ---
    updateGridButton.addEventListener('click', () => {
        selectedPointsForLine = [];
        currentPolygonPoints = [];
        // Reset highlights on any previously selected points (if any, though createGrid clears them)
        gridPoints.forEach(p => p.element.style.fill = ''); 
        isDrawingPolygon = false;
        startPolygonButton.textContent = 'Start Polygon';
        
        createGrid(); // This will now use the new values from inputs
        console.log(`Grid updated to ${currentGridRows}x${currentGridCols}`);
    });

    // --- Export Functionality ---
    const exportSVGButton = document.getElementById('exportSVG');
    const exportPNGButton = document.getElementById('exportPNG');

    exportSVGButton.addEventListener('click', () => {
        const svgData = new XMLSerializer().serializeToString(canvas);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'drawing.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("SVG export initiated.");
    });

    exportPNGButton.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const svgWidth = canvas.width.baseVal.value;
        const svgHeight = canvas.height.baseVal.value;
        tempCanvas.width = svgWidth;
        tempCanvas.height = svgHeight;

        // Create an image from SVG data
        const svgData = new XMLSerializer().serializeToString(canvas);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            tempCtx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url); // Revoke URL once image is loaded

            // Trigger PNG download
            const pngUrl = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'drawing.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("PNG export initiated.");
        };
        
        img.onerror = (e) => {
            console.error("Error loading SVG image for PNG conversion:", e);
            alert("Error exporting to PNG. The SVG might be too complex or contain elements not supported by direct canvas rendering.");
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    });
});
