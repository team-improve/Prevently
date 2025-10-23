import requests
import os
from dotenv import load_dotenv

load_dotenv()
base_url = os.getenv('BASE_URL', 'http://localhost:8000')

response = requests.get(f'{base_url}/auth/domains')
if response.status_code == 200:
    data = response.json()
    domains = data.get('domains', [])
    for i, domain in enumerate(domains[:3]):
        domain_id = domain.get('id')
        domain_name = domain.get('name')

    if domains:
        first_domain = domains[0]['id']
        response = requests.get(f'{base_url}/auth/analytics/sentiment?days=30&domain={first_domain}')
        if response.status_code != 200:
            pass
        else:
            data = response.json()
            analytics = data.get('analytics', [])