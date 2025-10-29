// main.js

const form = document.getElementById('expense-form');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const firstDateInput = document.getElementById('first-date');
const endDateInput = document.getElementById('end-date');
const list = document.getElementById('expense-list');
const totalDisplay = document.querySelector('.total');
const message = document.getElementById('message');

// ローカルストレージから読み込み
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let editingId = null; // 今編集中のID

// 初期表示
renderList();

// 入力後ラベルカラー変更
const inputs = document.querySelectorAll('#expense-form input');

inputs.forEach(input => {
    input.addEventListener('input', () => {
        const label = input.previousElementSibling; // inputの前のラベルを取得
        if (input.value) {
            label.style.color = "#df67bd" ; // 入力されていれば色を変える
        } else {
            label.style.color = ''; // 空なら元の色に戻す
        }
    });
});


// フォーム送信時
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
    const firstDate = firstDateInput.value;
    const endDate = endDateInput.value || null;

    if (!name || !amount || !firstDate) {
        alert('必要な項目を入力してくれ。');
        return;
    }

    if (editingId) {
        // 既存データを更新
        const index = expenses.findIndex(e => e.id === editingId);
        if (index !== -1) {
            expenses[index] = { 
                id: editingId, 
                name, 
                amount, 
                firstDate, 
                endDate };
            }
        editingId = null; // 編集終了
    } else {
        // 新規追加
        expenses.push({ 
            id: Date.now(),
            name,
            amount,
            firstDate,
            endDate,
            hiddenMonths:[]
        });
    }

    saveData();
    renderList();

     // 成功メッセージ
    message.textContent = '追加したよ～';
    message.style.color = 'rgba(255, 255, 255, 1)';
    message.classList.add('show');

    setTimeout(() => {
        message.classList.remove('show');
    }, 2000);

    // リセットとラベル色リセット
    form.reset();
    form.querySelectorAll('label').forEach(label => label.style.color = '');
});


// データ保存
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 今月支払い対象か判定
function isCurrentMonth(expense) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11

    const first = new Date(expense.firstDate);
    const end = expense.endDate ? new Date(expense.endDate) : null;

  // 今月の1日と月末を作る
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

  // 今月が支払い範囲内か
    if (end) {
        return first <= monthEnd && end >= monthStart;
    } else {
        // 単発支出
        return first.getFullYear() === year && first.getMonth() === month;
    }
}

// リスト表示
function renderList() {
    list.innerHTML = '';

    const grouped = {};

    expenses.forEach(expense => {
        let end = expense.endDate ? new Date(expense.endDate) : null;
        if (!end) end = new Date(expense.firstDate);

        let current = new Date(new Date(expense.firstDate).getFullYear(), new Date(expense.firstDate).getMonth(), 1);
        while (current <= end) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = [];
            if (!expense.hiddenMonths) expense.hiddenMonths = [];
            if(!expense.hiddenMonths.includes(key)) {
                grouped[key].push(expense);
            }
            current.setMonth(current.getMonth() + 1);
        }
    });

    Object.keys(grouped).sort().forEach(monthKey => {
        const monthExpenses = grouped[monthKey];
        // 空スキップ
        if (monthExpenses.length === 0) return;
        monthExpenses.sort((a,b) => new Date(a.firstDate).getDate() - new Date(b.firstDate).getDate());

        const [year, month] = monthKey.split('-');

        const box = document.createElement('div');
        box.classList.add('box');

        const title = document.createElement('span');
        title.classList.add('box-title');
        title.textContent = `${year}年${month}月`;
        box.appendChild(title);

        const ul = document.createElement('ul');
        let total = 0;

        monthExpenses.forEach(expense => {
            const day = new Date(expense.firstDate).getDate();
            const li = document.createElement('li');
            li.classList.add('grid');

            li.innerHTML = `
                <span class="top-left">${expense.name}</span>
                <span class="bottom-left">毎月${day}日</span>
                <span class="right">${expense.amount.toLocaleString()}<small>円</small></span>
            `;

            // ボタン用のdiv
            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('buttons');

            // 編集ボタン
            const editBtn = document.createElement('button');
            editBtn.textContent = '編集';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', () => {
                nameInput.value = expense.name;
                amountInput.value = expense.amount;
                firstDateInput.value = expense.firstDate;
                endDateInput.value = expense.endDate || '';
                editingId = expense.id;
            });
            buttonsDiv.appendChild(editBtn);

            // 削除ボタン
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {

            // 編集中のデータを削除した場合は編集状態を解除
            if (editingId === expense.id) {
                nameInput.value = '';
                amountInput.value = '';
                firstDateInput.value = '';
                endDateInput.value = '';
                editingId = null;
            }

            if (!expense.hiddenMonths) expense.hiddenMonths = [];
            if (!expense.hiddenMonths.includes(monthKey)) expense.hiddenMonths.push(monthKey); 
                saveData();
                message.textContent = '削除したよ～';
                message.style.color = 'rgba(255,255,255,1)';
                message.classList.add('show');
                setTimeout(() => { message.classList.remove('show'); }, 2000);
                renderList();
            
            });
            buttonsDiv.appendChild(deleteBtn);

            // 分割の場合だけ全削ボタン追加
            if (expense.endDate && expense.firstDate !== expense.endDate) {
                const deleteAllBtn = document.createElement('button');
                deleteAllBtn.textContent = '全削';
                deleteAllBtn.classList.add('delete-all-btn');
                deleteAllBtn.addEventListener('click', () => {
                expenses = expenses.filter(e => e.id !== expense.id);
                saveData();

                // 編集中のデータを削除した場合は編集状態を解除
                if (editingId === expense.id) {
                    nameInput.value = '';
                    amountInput.value = '';
                    firstDateInput.value = '';
                    endDateInput.value = '';
                    editingId = null;
                }

                    message.textContent = '全削したよ～';
                    message.style.color = 'rgba(255,255,255,1)';
                    message.classList.add('show');
                    setTimeout(() => { message.classList.remove('show'); }, 2000);
                    renderList();
                });

                buttonsDiv.appendChild(deleteAllBtn);
            }

            li.appendChild(buttonsDiv);
            ul.appendChild(li);

            total += expense.amount;
        });

        box.appendChild(ul);

        const totalDiv = document.createElement('div');
        totalDiv.className = 'total';
        totalDiv.innerHTML = `<span class="label">合計：</span>${total.toLocaleString()}円`;
        box.appendChild(totalDiv);

        list.appendChild(box);
    });
}


