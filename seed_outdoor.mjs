import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envStr = fs.readFileSync(envPath, 'utf8');

const env = Object.fromEntries(
  envStr.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const outdoorScenarios = [
  // Hetero Pria
  { id: 'pantai_sepi_pria', title: 'Pantai Sepi Malam Hari', description: 'Liburan berdua di pantai sepi berangin malam. Pasanganmu cuma pakai gaun tipis tembus pandang tanpa bra. Angin bikin putingnya tercetak jelas dan dia terus bergesekan denganmu minta dihangatkan.', thumbnail: 'https://placeholder.com/200x300?text=Pantai+Malam', category: 'hetero_pria', gender_target: 'male', base_prompt: 'Fantasi outdoor: Pantai sepi berangin malam hari. Adrenalin tinggi takut ketahuan orang lewat. Pasangan kedinginan minta dihangatkan. Slow-burn build up sebelum penetrasi di atas pasir.' },
  { id: 'mobil_parkiran_pria', title: 'Roadtrip & Parkiran Gelap', description: 'Lagi roadtrip malam, parkir di rest-area gelap. Dia duduk di kursi penumpang dengan hotpants super pendek, paha mulusnya sengaja dibuka lebar sambil natap kontolmu yang ngecap di celana.', thumbnail: 'https://placeholder.com/200x300?text=Parkiran+Gelap', category: 'hetero_pria', gender_target: 'male', base_prompt: 'Fantasi outdoor adrenalin: Ngentot di dalam mobil / parkiran gelap rest area. Ruang sempit, takut kepergok satpam atau orang lewat. Slow burn: raba-raba saat masih nyetir, lalu parkir.' },
  { id: 'hutan_camping_pria', title: 'Camping di Hutan', description: 'Camping berdua di tengah hutan yang dingin. Di dalam tenda sempit, dia sengaja lepas baju tebalnya dan cuma pakai tanktop, merangkak mendekatimu dengan memek yang udah basah.', thumbnail: 'https://placeholder.com/200x300?text=Camping', category: 'hetero_pria', gender_target: 'male', base_prompt: 'Fantasi outdoor: Camping di alam liar. Adrenalin suara alam dan tempat terpencil. Sinyal: kedinginan, merangkak di tenda, desahan yang harus ditahan.' },
  
  // Hetero Wanita
  { id: 'balkon_apartemen_wanita', title: 'Balkon Apartemen', description: 'Angin malam di balkon apartemen lantai atas. Laki-laki itu memeluk pinggangmu dari belakang. Tangan besarnya meremas payudaramu di balik baju sementara orang-orang di bawah sana tidak tahu apa yang sedang terjadi.', thumbnail: 'https://placeholder.com/200x300?text=Balkon+Apartemen', category: 'hetero_wanita', gender_target: 'female', base_prompt: 'Fantasi outdoor adrenalin: Balkon apartemen tinggi. Sensasi eksibisionis ringan takut dilihat tetangga gedung sebelah. Pria dominan memeluk dari belakang.' },
  { id: 'mobil_jalan_tol_wanita', title: 'Kursi Belakang Taksi/Mobil', description: 'Duduk berdua di kursi belakang mobil yang gelap saat melaju di tol. Dia sengaja melebarkan pahamu dan tangannya mulai menyusup ke balik rokmu tanpa disadari supir di depan.', thumbnail: 'https://placeholder.com/200x300?text=Mobil+Gelap', category: 'hetero_wanita', gender_target: 'female', base_prompt: 'Fantasi adrenalin: Di kursi belakang taksi/mobil. Takut ketahuan supir. Slow burn rabaan yang sangat intens tapi harus diam tanpa suara.' },
  
  // Lesbian
  { id: 'kamar_ganti_lesbian', title: 'Kamar Ganti Gym/Mall', description: 'Kamar ganti mall/gym yang sepi. Kalian berdua masuk satu bilik sempit. Dia mengunci pintu pelan, lalu menatap bibirmu dengan mata lapar. Napasnya mengenai lehermu, siap menggesek memek di ruang publik.', thumbnail: 'https://placeholder.com/200x300?text=Kamar+Ganti', category: 'lesbian', gender_target: 'female_lesbian', base_prompt: 'Fantasi outdoor/public: Kamar ganti gym/mall yang sempit. Adrenalin tinggi takut ada yang masuk atau dengar desahan. Scissoring berdiri saling sandar dinding.' },
  { id: 'bioskop_sepi_lesbian', title: 'Pojok Bioskop Sepi', description: 'Nonton film midnight di bioskop sepi. Di kursi paling belakang, tangannya tak lagi pegang popcorn, tapi mulai menyelinap ke dalam celana dalammu. Kalian harus menahan desahan di tengah suara film.', thumbnail: 'https://placeholder.com/200x300?text=Bioskop+Sepi', category: 'lesbian', gender_target: 'female_lesbian', base_prompt: 'Fantasi adrenalin public space: Kursi belakang bioskop gelap. Jari-jari masuk ke dalam celana, menahan desahan agar tidak didengar penonton lain.' }
];

async function seedOutdoor() {
  console.log('🌲 Menambahkan Skenario Outdoor & Adrenalin...');
  const { data, error } = await supabase.from('scenarios').insert(outdoorScenarios).select();

  if (error) {
    if (error.code === '23505') {
       console.log('Skenario outdoor sudah ada (Duplicate)');
    } else {
       console.error('Gagal insert data:', error);
    }
  } else {
    console.log(`✅ Berhasil menambahkan ${data.length} skenario outdoor.`);
  }
}

seedOutdoor();
