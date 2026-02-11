import { db } from '@/db';

async function checkUsers() {
    try {
        const users = await db.query.user.findMany();
        console.log('📊 Total users in database:', users.length);

        if (users.length > 0) {
            console.log('\n👥 Users:');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
            });
        } else {
            console.log('\n⚠️ No users found in database');
            console.log('💡 Notifications will only be sent when there are registered users');
        }
    } catch (error) {
        console.error('❌ Error checking users:', error);
    }
}

checkUsers();
