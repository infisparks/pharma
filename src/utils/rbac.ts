import { createClient } from './supabase/client';

export async function checkUserRole(roleRequired: string = 'admin') {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('user_access')
        .select('role')
        .eq('uid', user.id)
        .single();

    if (error || !data) {
        console.error('RBAC Error Detail:', {
            error,
            searchedUid: user.id,
            table: 'user_access'
        });
        return false;
    }

    return data.role === roleRequired;
}

export async function isAdmin() {
    return await checkUserRole('admin');
}
