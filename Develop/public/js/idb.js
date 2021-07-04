const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;


let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event){
  const db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true })
}

request.onsuccess = function(event){
  db = event.target.result;
  
  if(navigator.onLine){
    uploadTransactions();
  }
}

request.onerror = function(event){
  console.log(event.target.errorCode)
}

function saveRecord(record){
  alert(`You're currently offline, your transaction will be submitted when the connection is re-established.`)
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('new_transaction');

  transactionObjectStore.add(record)
}

function uploadTransactions() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('new_transaction');

  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function(){
    if(getAll.result.length > 0){
        fetch('/api/transaction', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type':'application/json'
          }
        })
        .then(res => res.json())
        .then(serverResponse => {
          if(serverResponse.message){
            throw new Error(serverResponse)
          }

          const transaction = db.transaction(['new_transaction'], 'readwrite')
          const transactionObjectStore = transaction.objectStore('new_transaction')
          transactionObjectStore.clear();
          alert('Your offline transactions have been submitted!')
        })
        .catch(err => {
          console.log(err)
        })
    }
  }
}

window.addEventListener('online', uploadTransactions)