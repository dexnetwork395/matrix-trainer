// math.js — Математическое ядро с поддержкой перестановки строк (swap)

class MatrixEngine {
    constructor(size, difficulty = 'medium') {
        this.size = size;
        this.difficulty = difficulty;
        this.leftData = [];
        this.rightData = [];
        this.history = [];
        this.redoStack = [];
        this.initIdentity();
    }

    initIdentity() {
        this.leftData = [];
        this.rightData = [];
        for (let i = 0; i < this.size; i++) {
            let leftRow = [];
            let rightRow = [];
            for (let j = 0; j < this.size; j++) {
                leftRow.push(new Fraction(i === j ? 1 : 0));
                rightRow.push(new Fraction(i === j ? 1 : 0));
            }
            this.leftData.push(leftRow);
            this.rightData.push(rightRow);
        }
        this.history = [];
        this.redoStack = [];
        this.saveState();
    }

    saveState() {
        let snapshot = {
            left: this.leftData.map(row => row.map(cell => new Fraction(cell))),
            right: this.rightData.map(row => row.map(cell => new Fraction(cell)))
        };
        this.history.push(snapshot);
    }

    undo() {
        if (this.history.length > 1) {
            let currentState = {
                left: this.leftData.map(row => row.map(cell => new Fraction(cell))),
                right: this.rightData.map(row => row.map(cell => new Fraction(cell)))
            };
            this.redoStack.push(currentState);
            
            this.history.pop();
            let prevState = this.history[this.history.length - 1];
            
            this.leftData = prevState.left.map(row => row.map(cell => new Fraction(cell)));
            this.rightData = prevState.right.map(row => row.map(cell => new Fraction(cell)));
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            let nextState = this.redoStack.pop();
            let currentState = {
                left: this.leftData.map(row => row.map(cell => new Fraction(cell))),
                right: this.rightData.map(row => row.map(cell => new Fraction(cell)))
            };
            this.history.push(currentState);

            this.leftData = nextState.left.map(row => row.map(cell => new Fraction(cell)));
            this.rightData = nextState.right.map(row => row.map(cell => new Fraction(cell)));
            return true;
        }
        return false;
    }

    generateNiceMatrix(difficulty) {
        if (difficulty) this.difficulty = difficulty;
        this.initIdentity();

        let steps, scalars;
        if (this.difficulty === 'easy') {
            steps = this.size * 1;
            scalars = [-1, 1];
        } else if (this.difficulty === 'hard') {
            steps = this.size * 3 + 2;
            scalars = [-3, -2, -1, 1, 2, 3];
        } else {
            steps = this.size * 2 + 1;
            scalars = [-2, -1, 1, 2];
        }

        for (let s = 0; s < steps; s++) {
            let actionType = Math.floor(Math.random() * 2);
            let r1 = Math.floor(Math.random() * this.size);
            let r2 = Math.floor(Math.random() * this.size);
            if (actionType === 0 && r1 === r2) {
                r2 = (r1 + 1) % this.size;
            }

            if (actionType === 0) {
                let k = scalars[Math.floor(Math.random() * scalars.length)];
                let kFrac = new Fraction(k);
                for (let j = 0; j < this.size; j++) {
                    let prod = this.leftData[r2][j].mul(kFrac);
                    this.leftData[r1][j] = this.leftData[r1][j].add(prod);
                }
            } else {
                this.multiplyRow(r1, -1);
            }
        }

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.rightData[i][j] = new Fraction(i === j ? 1 : 0);
            }
        }

        this.history = [];
        this.redoStack = [];
        this.saveState();
    }

    resize(newSize, mode, difficulty) {
        this.size = newSize;
        this.generateNiceMatrix(difficulty);
    }

    multiplyRow(rowIndex, scalar) {
        let k = new Fraction(scalar);
        for (let j = 0; j < this.size; j++) {
            this.leftData[rowIndex][j] = this.leftData[rowIndex][j].mul(k);
            this.rightData[rowIndex][j] = this.rightData[rowIndex][j].mul(k);
        }
    }

    divideRow(rowIndex, divisor) {
        let n = new Fraction(divisor);
        if (n.equals(0)) throw new Error("Деление на ноль невозможно!");
        let k = new Fraction(1).div(n);
        this.multiplyRow(rowIndex, k);
    }

    addRow(targetIndex, sourceIndex, scalar) {
        let k = new Fraction(scalar);
        for (let j = 0; j < this.size; j++) {
            let leftProd = this.leftData[sourceIndex][j].mul(k);
            this.leftData[targetIndex][j] = this.leftData[targetIndex][j].add(leftProd);

            let rightProd = this.rightData[sourceIndex][j].mul(k);
            this.rightData[targetIndex][j] = this.rightData[targetIndex][j].add(rightProd);
        }
    }

    swapRows(row1, row2) {
        if (row1 < 0 || row1 >= this.size || row2 < 0 || row2 >= this.size) {
            throw new Error("Неверные индексы строк для перестановки!");
        }
        let tempL = this.leftData[row1];
        this.leftData[row1] = this.leftData[row2];
        this.leftData[row2] = tempL;

        let tempR = this.rightData[row1];
        this.rightData[row1] = this.rightData[row2];
        this.rightData[row2] = tempR;
    }

    getIdealStandard(mode) {
        let idealLeft = [];
        let idealRight = [];
        for (let i = 0; i < this.size; i++) {
            let lRow = [], rRow = [];
            for (let j = 0; j < this.size; j++) {
                if (mode === 'gauss') {
                    lRow.push(new Fraction(i <= j ? 1 : 0));
                    rRow.push(new Fraction(0));
                } else if (mode === 'inverse') {
                    lRow.push(new Fraction(i === j ? 1 : 0));
                    rRow.push(new Fraction(i === j ? 1 : 0));
                }
            }
            idealLeft.push(lRow);
            idealRight.push(rRow);
        }
        return { left: idealLeft, right: idealRight };
    }

    executeExpression(expr) {
        let clean = expr.replace(/\s+/g, '').replace(/→/g, '⇒');
        if (clean.includes('⇒')) {
            clean = clean.split('⇒')[1];
        }

        let success = false;

        // Шаблон для перестановки строк (например, Str1 <-> Str2 или Str1 ↔ Str2)
        let matchSwap = clean.match(/^Str(\d+)(?:<->|↔)Str(\d+)$/);
        if (matchSwap) {
            let r1 = parseInt(matchSwap[1]) - 1;
            let r2 = parseInt(matchSwap[2]) - 1;
            this.swapRows(r1, r2);
            success = true;
        }

        // Шаблон 1: Умножение строки
        let matchMult = clean.match(/^Str(\d+)\*(-?[\d\.\/]+)$/);
        if (matchMult && !success) {
            let target = parseInt(matchMult[1]) - 1;
            let scalar = matchMult[2];
            if (target >= 0 && target < this.size) {
                this.multiplyRow(target, scalar);
                success = true;
            }
        }

        // Шаблон 2: Деление строки
        let matchDiv = clean.match(/^Str(\d+)\/(-?[\d\.\/]+)$/);
        if (matchDiv && !success) {
            let target = parseInt(matchDiv[1]) - 1;
            let divisor = matchDiv[2];
            if (target >= 0 && target < this.size) {
                this.divideRow(target, divisor);
                success = true;
            }
        }

        // Шаблон 3: Сложение/Вычитание строк
        let matchAdd = clean.match(/Str(\d+)([\+\-])(-?[\d\.\/]*)[\·\*]?Str(\d+)/);
        if (matchAdd && !success) {
            let target = parseInt(matchAdd[1]) - 1;
            let sign = matchAdd[2];
            let scalarStr = matchAdd[3];
            let scalar = (scalarStr === '' || scalarStr === undefined) ? '1' : scalarStr;
            let source = parseInt(matchAdd[4]) - 1;

            if (sign === '-') scalar = '-' + scalar;

            if (target >= 0 && target < this.size && source >= 0 && source < this.size) {
                this.addRow(target, source, scalar);
                success = true;
            }
        }

        if (success) {
            this.redoStack = [];
            this.saveState();
            return true;
        }

        throw new Error("Формат не распознан. Примеры: Str1 ↔ Str2, Str1 * -1, Str2 / 2, Str3 - 1/4*Str1, Str1 + Str3");
    }
}