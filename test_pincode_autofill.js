// Test script for pincode auto-fill functionality
// Simulates the getPincodeFromLocality function with the updated lookup table

const GUWAHATI_PINCODES = {
  '781001': ['pan bazar', 'fancy bazar', 'ambari', 'athgaon', 'uzan bazar'],
  '781003': ['silpukhuri', 'chandmari', 'chenikuthi', 'rajgarh', 'rajgarh road'],
  '781005': ['christian basti', 'bhangagarh', 'supermarket', 'sarumotoria'],
  '781007': ['ulubari', 'sarania'],
  '781008': ['rehabari', 'paltan bazar', 'paltanbazar', 'machkhowa', 'bharalumukh', 'nepali mandir'],
  '781010': ['kamakhya'],
  '781011': ['maligaon'],
  '781012': ['pandu', 'adabari'],
  '781013': ['jalukbari'],
  '781016': ['kalapahar'],
  '781018': ['barsapara', 'fatasil ambari'],
  '781019': ['kahilipara'],
  '781020': ['noonmati'],
  '781021': ['bamunimaidan'],
  '781022': ['khanapara', 'jatia', 'six mile'],
  '781024': ['zoo road', 'ambikagiri nagar'],
  '781026': ['narengi'],
  '781028': ['beltola', 'beltola chariali'],
  '781029': ['basistha', 'basistha chariali', 'bhetapara', 'lalmati'],
  '781033': ['boragaon'],
  '781034': ['lal ganesh', 'lokhra'],
  '781035': ['garchuk', 'gorchuk'],
  '781036': ['hengrabari', 'bormotoria'],
  '781037': ['panjabari'],
  '781038': ['hatigaon', 'hatigaon chariali'],
};

function getPincodeFromLocality(locality) {
  if (!locality) return null;
  const normalizedLocality = locality.toLowerCase().trim();
  
  for (const [pincode, localities] of Object.entries(GUWAHATI_PINCODES)) {
    for (const loc of localities) {
      if (loc.toLowerCase() === normalizedLocality || 
          normalizedLocality.includes(loc.toLowerCase()) ||
          loc.toLowerCase().includes(normalizedLocality)) {
        return pincode;
      }
    }
  }
  return null;
}

// Test localities as specified by user
const testLocalities = [
  'Rehabari',
  'Ulubari',
  'Bhangagarh',
  'Christian Basti',
  'Paltan Bazar',
  'Kalapahar',
  'Barsapara',
  'Lokhra',
  'Garchuk',
  'Hatigaon',
  'Bhetapara',
  'Lalmati',
  'Chandmari',
  'Silpukhuri',
  'Ambari',
  'Chenikuthi',
  'Uzan Bazar',
  'Bormotoria',
  'Sarumotoria',
  'Supermarket',
];

console.log('=== PINCODE AUTO-FILL TEST RESULTS ===\n');
console.log('Locality'.padEnd(25) + 'Expected'.padEnd(12) + 'Auto-filled'.padEnd(14) + 'Status');
console.log('='.repeat(65));

let passCount = 0;
let failCount = 0;

const expectedPincodes = {
  'Rehabari': '781008',
  'Ulubari': '781007',
  'Bhangagarh': '781005',
  'Christian Basti': '781005',
  'Paltan Bazar': '781008',
  'Kalapahar': '781016',
  'Barsapara': '781018',
  'Lokhra': '781034',
  'Garchuk': '781035',
  'Hatigaon': '781038',
  'Bhetapara': '781029',
  'Lalmati': '781029',
  'Chandmari': '781003',
  'Silpukhuri': '781003',
  'Ambari': '781001',
  'Chenikuthi': '781003',
  'Uzan Bazar': '781001',
  'Bormotoria': '781036',
  'Sarumotoria': '781005',
  'Supermarket': '781005',
};

testLocalities.forEach(locality => {
  const expected = expectedPincodes[locality];
  const result = getPincodeFromLocality(locality);
  const status = result === expected ? 'PASS' : 'FAIL';
  
  if (status === 'PASS') {
    passCount++;
  } else {
    failCount++;
  }
  
  console.log(
    locality.padEnd(25) + 
    expected.padEnd(12) + 
    (result || 'null').padEnd(14) + 
    status
  );
});

console.log('='.repeat(65));
console.log(`Total: ${testLocalities.length} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log(`Success Rate: ${((passCount / testLocalities.length) * 100).toFixed(1)}%`);
