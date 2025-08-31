let currentInput = '';
        let currentResult = null;
        let calculationHistory = [];
        let historyVisible = false;
        let isNewCalculation = true;
        let superscriptMode = false;

        const displayInput = document.getElementById('displayInput');
        const displayResult = document.getElementById('displayResult');
        const historyContainer = document.getElementById('historyContainer');
        const historyList = document.getElementById('historyList');
        const historyToggle = document.getElementById('historyToggle');

        function appendToDisplay(value) {
            // Jeśli jest wynik i użytkownik zaczyna nowe działanie od operatora mate,atycznego
            if (currentResult !== null && isNewCalculation && ['+', '-', '×', '÷', '^'].includes(value)) {
                currentInput = formatNumberWithSpaces(currentResult.toString()).replace(/\./g, ',') + value;
                isNewCalculation = false;
            } 
            // Jeśli jwst wynik i użytkownik zaczyna wprowadzać liczbę (w domyśle chce zacząć nowe obliczenia, bo nie dał operatora sugerującego kontynuację)
            else if (currentResult !== null && isNewCalculation && !['+', '-', '×', '÷', '^'].includes(value)) {
                currentInput = value;
                currentResult = null;
                isNewCalculation = false;
            }
            else {
                // Obsługa trybu indeksu górnego dla potęg
                if (value === '^') {
                    superscriptMode = true;
                    currentInput += value;
                    displayInput.innerHTML = formatDisplay(currentInput);
                    return;
                }
                
                if (superscriptMode && !isNaN(value) || value === '(' || value === ')') {
                    currentInput += value;
                    displayInput.innerHTML = formatDisplay(currentInput);
                    return;
                } else {
                    superscriptMode = false;
                    currentInput += value;
                }
                
                isNewCalculation = false;
            }
            
            displayInput.innerHTML = formatDisplay(currentInput);
            // Ukrywa wynik podczas nowego wprowadzania
            if (currentResult !== null && !isNewCalculation) {
                displayResult.textContent = '';
                currentResult = null;
            }
        }
            // wymouszona kolejność zmiany formatowania znaku dzielenia
        function formatDisplay(input) {
            // 1. najpierw formatuj potęgi, aby uniknąć problemu z zamianą znaku "/" w indeksach
            let formatted = input.replace(/\^(\d+)/g, (match, p1) => {
                return `<sup>${p1}</sup>`;
            });
            
            // 2. następnie zamia operatory, ale tylko poza znacznikami HTML
            formatted = formatted
                .replace(/\*/g, '×')
                .replace(/π/g, 'π')
                .replace(/Math\.PI/g, 'π')
                .replace(/Math\.E/g, 'e');
                
            return formatted;
        }

        // Funkcja formatująca liczby z separatorem tysięcy (spacjami)
        function formatNumberWithSpaces(numberStr) {
            // Sprawdzenie, czy liczba zawiera część dziesiętną
            const parts = numberStr.split('.');
            let integerPart = parts[0];
            const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
            
            // Formatowanie części całkowitej z separatorami
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            
            return integerPart + decimalPart;
        }

        function insertConstant(constant) {
            if (currentResult !== null && isNewCalculation) {
                currentInput = constant;
                currentResult = null;
                isNewCalculation = false;
            } else {
                currentInput += constant;
            }
            
            displayInput.innerHTML = formatDisplay(currentInput);
            
            if (currentResult !== null && !isNewCalculation) {
                displayResult.textContent = '';
                currentResult = null;
            }
        }

        function deleteLast() {
            // Usuwanie ostatniego znaku, uwzględniając indeksy górne
            if (currentInput.endsWith('^') || /\^\d+$/.test(currentInput)) {
                // Jeśli ostatnie jest potęgowanie, usuwa cały fragment potęgi
                currentInput = currentInput.replace(/\^\d+$/, '');
            } else {
                currentInput = currentInput.slice(0, -1);
            }
            
            displayInput.innerHTML = formatDisplay(currentInput);
            superscriptMode = false;
        }

        function clearCalculator() {
            currentInput = '';
            currentResult = null;
            isNewCalculation = true;
            superscriptMode = false;
            displayInput.innerHTML = '';
            displayResult.textContent = '';
        }

        // Funkcja zaokraglająca wyniki i unikająca błędów zmiennoprzecinkowych (0,3 - 0,1 nie zawsze daje 0,2 :)
        function roundResult(num, precision = 6) {
            if (num === null || isNaN(num)) return num;
            
            const factor = Math.pow(10, precision);

            const rounded = Math.round(num * factor) / factor;
            
            return parseFloat(rounded.toFixed(precision));
        }

        function calculate() {
            try {
                // Zamiana znaków na odpowiedniki do obliczeń
                let expressionForEval = currentInput
                    .replace(/,/g, '.')
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e/g, 'Math.E')
                    .replace(/\^/g, '**');
                
                const result = eval(expressionForEval);
                const roundedResult = roundResult(result);
                
                // Formatowanie wyrażenia do wyświetlania
                const displayExpression = currentInput
                    .replace(/\*/g, '×')
                    .replace(/\//g, '÷')
                    .replace(/Math\.PI/g, 'π')
                    .replace(/Math\.E/g, 'e');
                
                addToHistory(displayExpression, roundedResult);
                
                // Formatowanie wyniku z przecinkiem zamiast kropki i separatorami tysięcy
                // // Funkcja obecnie jest bez sensu, bo zamienia . na . ale zostanie rozbudowana. Aby nie porzebudowywać kodu, pozostawiona w tej osobiwej formie
                let resultStr = roundedResult.toString();
                if (resultStr.includes('.')) {
                    resultStr = resultStr.replace('.', '.');
                }
                
                // Dodanie separatorów tysięcy
                resultStr = formatNumberWithSpaces(resultStr);
                
                displayResult.textContent = resultStr;
                currentInput = '';
                displayInput.innerHTML = '';
                
                currentResult = roundedResult;
                isNewCalculation = true;
                superscriptMode = false;
                
            } catch (error) {
                displayResult.textContent = 'Błąd';
                setTimeout(() => {
                    displayResult.textContent = '';
                }, 1000);
            }
        }

        function addToHistory(expression, result) {
            calculationHistory.unshift({
                expression: expression,
                result: result
            });
            
            updateHistoryDisplay();
        }

        function updateHistoryDisplay() {
            if (calculationHistory.length === 0) {
                historyList.innerHTML = '<div class="empty-history">Brak historii obliczeń</div>';
                return;
            }

            historyList.innerHTML = '';
            calculationHistory.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                // Formatowanie wyrażenia do historii
                let formattedExpression = formatDisplay(item.expression);
                
                // Formatowanie wyniku
                let resultStr = item.result.toString();
                if (resultStr.includes('.')) {
                    resultStr = resultStr.replace('.', '.');
                }
                
                // Dodanie separatorów tysięcy do wyniku w historii
                resultStr = formatNumberWithSpaces(resultStr);
                
                historyItem.innerHTML = `
                    <div>
                        <div class="history-expression">${formattedExpression}</div>
                        <div class="history-result">= ${resultStr}</div>
                    </div>
                    <button class="delete-history" onclick="deleteHistoryItem(${index})">×</button>
                `;
                historyList.appendChild(historyItem);
            });
        }

        function deleteHistoryItem(index) {
            calculationHistory.splice(index, 1);
            updateHistoryDisplay();
        }

        function toggleHistory() {
            historyVisible = !historyVisible;
            
            if (historyVisible) {
                historyContainer.classList.add('visible');

                updateHistoryDisplay();
            } else {
                historyContainer.classList.remove('visible');
            }
        }

        document.addEventListener('keydown', function(event) {
            if (event.key >= '0' && event.key <= '9') {
                appendToDisplay(event.key);
            } else if (event.key === '+') {
                appendToDisplay('+');
            } else if (event.key === '-') {
                appendToDisplay('-');
            } else if (event.key === '*') {
                appendToDisplay('×');
            } else if (event.key === '/') {
                event.preventDefault();
                appendToDisplay('÷');
            } else if (event.key === '^') {
                appendToDisplay('^');
            } else if (event.key === '(' || event.key === ')') {
                appendToDisplay(event.key);
            } else if (event.key === 'Enter' || event.key === '=') {
                calculate();
            } else if (event.key === 'Escape') {
                clearCalculator();
            } else if (event.key === 'Backspace') {
                deleteLast();
            }
        });