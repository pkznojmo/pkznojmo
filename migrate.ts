import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Načtení z proměnných prostředí (bezpečné pro GitHub)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 2. Výchozí heslo pro všechny migrované plavce
const TEMP_PASSWORD = 'Plaveme2026!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parsePhpMyAdminJson(filePath: string) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const tableObject = rawData.find((item: any) => item.type === 'table');
  return tableObject ? tableObject.data : [];
}

async function migrateData() {
  console.log('🚀 Načítám data z JSON souborů...');

  const swimmers = parsePhpMyAdminJson('./swimmers.json');
  const attendance = parsePhpMyAdminJson('./attendance.json');

  console.log(`Načteno plavců: ${swimmers.length}`);
  console.log(`Načteno záznamů docházky: ${attendance.length}`);

  const legacyToUuidMap = new Map<number, string>();

  // 1. MIGRACE PLAVCŮ
  console.log('\n--- Začínám migraci plavců ---');
  for (const swimmer of swimmers) {
    const legacyId = Number(swimmer.id);
    const username = swimmer.username.toLowerCase().trim();
    const internalEmail = `${username}@internal.pkznojmo.cz`;

    console.log(`[${legacyId}] Vytvářím uživatele: ${swimmer.first_name} ${swimmer.last_name} (${username})`);

    // Vytvoření v Auth s výchozím heslem
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: internalEmail,
      password: TEMP_PASSWORD, // <--- ZDE SE NASTAVÍ DOČASNÉ HESLO
      email_confirm: true,
      user_metadata: {
        username: username,
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
      }
    });

    if (authError) {
      console.error(`❌ Chyba při vytváření uživatele ${username}:`, authError.message);
      continue;
    }

    const userId = authUser.user.id;
    legacyToUuidMap.set(legacyId, userId);

    // Vložení do profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        legacy_id: legacyId,
        csps_id: swimmer.csps_id ? Number(swimmer.csps_id) : null,
        team_id: swimmer.team_id ? Number(swimmer.team_id) : null,
        first_name: swimmer.first_name,
        last_name: swimmer.last_name,
        birth_year: swimmer.birth_year ? Number(swimmer.birth_year) : null,
        username: username,
        active: Number(swimmer.active) === 1,
        email_provided: false
      });

    if (profileError) {
      console.error(`❌ Chyba profilu pro ${username}:`, profileError.message);
    }

    // Role plavce
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'swimmer'
    });
  }

  // 2. MIGRACE DOCHÁZKY
  console.log('\n--- Začínám migraci docházky ---');
  const attendanceToInsert = [];

  for (const record of attendance) {
    const swimmerLegacyId = Number(record.swimmer_id);
    const swimmerUuid = legacyToUuidMap.get(swimmerLegacyId);

    if (!swimmerUuid) continue;

    attendanceToInsert.push({
      legacy_id: Number(record.id),
      swimmer_id: swimmerUuid,
      date: record.date,
      morning_km: parseFloat(record.morning_km || '0.00'),
      afternoon_km: parseFloat(record.afternoon_km || '0.00'),
      dry_minutes: parseInt(record.dry_minutes || '0', 10),
      created_at: record.created_at
    });
  }

  const chunkSize = 500;
  for (let i = 0; i < attendanceToInsert.length; i += chunkSize) {
    const chunk = attendanceToInsert.slice(i, i + chunkSize);
    const { error: attError } = await supabase.from('attendance').insert(chunk);

    if (attError) {
      console.error(`❌ Chyba docházky:`, attError.message);
    } else {
      console.log(`Vloženo docházek: ${Math.min(i + chunkSize, attendanceToInsert.length)} / ${attendanceToInsert.length}`);
    }
  }

  console.log('\n🎉 MIGRACE DOKONČENA!');
}

migrateData();