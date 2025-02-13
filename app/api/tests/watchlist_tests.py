# Browser console fetch commands to test watchlist routes

## Testing rules

### Watchlist 4 (belonging to user 2) should remain empty for testing

"""
#1 - Test GET session user's watchlists
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
fetch('/api/watchlists/2', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
"""