/**
 * Convert number to Indonesian words (Terbilang)
 */
export function terbilang(n: number): string {
  const words = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ]
  
  let res = ''
  const val = Math.floor(n)

  if (val < 12) {
    res = words[val]
  } else if (val < 20) {
    res = terbilang(val - 10) + ' Belas'
  } else if (val < 100) {
    res = terbilang(Math.floor(val / 10)) + ' Puluh ' + terbilang(val % 10)
  } else if (val < 200) {
    res = 'Seratus ' + terbilang(val - 100)
  } else if (val < 1000) {
    res = terbilang(Math.floor(val / 100)) + ' Ratus ' + terbilang(val % 100)
  } else if (val < 2000) {
    res = 'Seribu ' + terbilang(val - 1000)
  } else if (val < 1000000) {
    res = terbilang(Math.floor(val / 1000)) + ' Ribu ' + terbilang(val % 1000)
  } else if (val < 1000000000) {
    res = terbilang(Math.floor(val / 1000000)) + ' Juta ' + terbilang(val % 1000000)
  } else if (val < 1000000000000) {
    res = terbilang(Math.floor(val / 1000000000)) + ' Miliar ' + terbilang(val % 1000000000)
  } else if (val < 1000000000000000) {
    res = terbilang(Math.floor(val / 1000000000000)) + ' Triliun ' + terbilang(val % 1000000000000)
  }

  return res.trim().replace(/\s+/g, ' ')
}

export function formatTerbilang(n: number): string {
  if (n === 0) return 'Nol Rupiah'
  return terbilang(n) + ' Rupiah'
}
