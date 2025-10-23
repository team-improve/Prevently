// Test the parseCompanies function
function parseCompanies(companiesStr) {
  if (Array.isArray(companiesStr)) {
    return companiesStr;
  }
  if (typeof companiesStr === 'string') {
    try {
      const cleaned = companiesStr.replace(/'/g, '"');
      return JSON.parse(cleaned);
    } catch (e) {
      const matches = companiesStr.match(/'([^']+)'/g);
      if (matches) {
        return matches.map(match => match.slice(1, -1));
      }
      return [];
    }
  }
  return [];
}

console.log('Test 1:', parseCompanies("['Met', '##F', 'iFixit', 'Meta']"));
console.log('Test 2:', parseCompanies(['already', 'an', 'array']));
console.log('Test 3:', parseCompanies('not an array'));