# Browser console fetch commands to test the ORIGINAL watchlist routes

"""
function getCsrfToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
}
"""

"""
#1 - Fetch-> GET session user's watchlists test
fetch('/api/watchlists/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Ensures cookies/session data is sent
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#2 - Fetch-> CREATE a watchlist
fetch('/api/watchlists/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken()
  },
  credentials: 'include',  // Ensures cookies (e.g., session authentication) are sent
  body: JSON.stringify({ name: 'My New Watchlist' })  // Replace with desired watchlist name
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#3 - Fetch-> UPDATE a watchlist name
fetch('/api/watchlists/1', {  // Replace "1" with the actual watchlist ID you want to update
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken()
  },
  credentials: 'include',  // Ensures cookies (e.g., session authentication) are sent
  body: JSON.stringify({ name: 'Updated Watchlist Name' })  // Replace with the new name
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#4 - Fetch-> DELETE a session user's watchlist
fetch('/api/watchlists/2', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken()
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""

"""
#4 - Fetch-> ADD a stock to a session user's watchlist(s)
function getCsrfToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
}

fetch('/api/watchlists/stocks/MDB', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include',
    body: JSON.stringify({ watchlist_ids: [5, 7] })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
"""

"""
#5 - Fetch-> REMOVE a stock from a session user's watchlist(s) test
function getCsrfToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
}

fetch('/api/watchlists/stocks/NVDA', {
    method: 'DELETE',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include',
    body: JSON.stringify({ watchlist_ids: [5] })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
"""

"""
#6 - Fetch-> GET list of session user watchlists that contain a specific stock
function getCsrfToken() {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
}

fetch('/api/watchlists/stocks/AAPL', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
"""