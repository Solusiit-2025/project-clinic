const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const content = fs.readFileSync(path, 'utf8');

// 1. Add Ref
let newContent = content.replace("const hasFetchedRef = useRef<string | null>(null)", "const hasFetchedRef = useRef<string | null>(null)\n  const labDropdownRef = useRef<HTMLDivElement>(null)");

// 2. Add click outside effect
const effectCode = `
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labDropdownRef.current && !labDropdownRef.current.contains(event.target as Node)) {
        setIsLabDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
`;

// Insert effect before Medicine Search Logic
newContent = newContent.replace("// Medicine Search Logic", effectCode + "\n  // Medicine Search Logic");

// 3. Update UI: Add dropdown ref, toggle button, and change condition
// We look for <div className='relative group'> at line 967 (approximately)
// Note: In the actual file it might have single quotes or double quotes.

const searchInputStart = `<div className='relative group'>
                           <label className='text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-rose-500 transition-colors'>Cari Pemeriksaan Lab</label>
                           <div className='mt-3 relative'>`;

const replacement = `<div className='relative group' ref={labDropdownRef}>
                           <label className='text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-rose-500 transition-colors'>Cari Pemeriksaan Lab</label>
                           <div className='mt-3 relative'>
                              <button 
                                 onClick={() => setIsLabDropdownOpen(!isLabDropdownOpen)}
                                 className='absolute inset-y-0 right-4 flex items-center z-10 text-slate-400 hover:text-rose-500 transition-colors'
                              >
                                 <FiChevronDown className={\`w-5 h-5 transition-transform \${isLabDropdownOpen ? 'rotate-180' : ''}\`} />
                              </button>`;

newContent = newContent.replace(searchInputStart, replacement);

// 4. Update dropdown condition and filter
// Old: {isLabDropdownOpen && searchLab && (
// New: {isLabDropdownOpen && (

newContent = newContent.replace("{isLabDropdownOpen && searchLab && (", "{isLabDropdownOpen && (");

// 5. Update filter to show items when search is empty
const oldFilter = `allServices.filter(s => 
                                          s.serviceName.toLowerCase().includes(searchLab.toLowerCase()) ||
                                          s.serviceCategory?.categoryName?.toLowerCase().includes('lab')
                                       )`;

const newFilter = `allServices.filter(s => {
                                          const search = searchLab.toLowerCase();
                                          const name = s.serviceName.toLowerCase();
                                          const category = s.serviceCategory?.categoryName?.toLowerCase() || '';
                                          const isLab = name.includes('lab') || category.includes('lab');
                                          
                                          if (!search) return isLab;
                                          return name.includes(search) || category.includes(search);
                                       })`;

// Replace both occurrences of the filter
newContent = newContent.split(oldFilter).join(newFilter);

fs.writeFileSync(path, newContent);
console.log('Lab Search Enhancement Success');
