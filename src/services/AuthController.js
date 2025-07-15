import supabase from './SupabaseService.js';

class AuthController {
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Translate error ke bahasa Indonesia
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Email atau password salah');
                }
                throw new Error('Gagal login: ' + error.message);
            }

            // Get additional user data from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.warn('Warning: Gagal ambil data user tambahan:', userError);
            }

            return {
                user: { ...data.user, ...userData },
                session: data.session,
            };
        } catch (error) {
            throw error;
        }
    }

    static async register(email, password, userData) {
        try {
            // Validasi email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Format email tidak valid');
            }

            // Validasi password
            if (!password || password.length < 6) {
                throw new Error('Password minimal 6 karakter');
            }

            console.log('Mencoba register dengan email:', email);
            console.log('Data user yang akan disimpan:', userData);

            // Bersihkan email dari spasi dan ubah ke lowercase
            const cleanEmail = email.trim().toLowerCase();

            // Register dengan Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                    data: {
                        nama_lengkap: userData.nama_lengkap || ''
                    }
                }
            });

            if (error) {
                console.error('Supabase signup error:', error);

                // Translate error messages ke bahasa Indonesia
                if (error.message.includes('Email address') && error.message.includes('invalid')) {
                    throw new Error('Email tidak valid. Coba gunakan email lain seperti user@example.com');
                }
                if (error.message.includes('Password should be at least')) {
                    throw new Error('Password minimal 6 karakter');
                }
                if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
                    throw new Error('Email sudah terdaftar. Silakan login atau gunakan email lain');
                }
                if (error.message.includes('signup')) {
                    throw new Error('Pendaftaran tidak diizinkan. Hubungi administrator');
                }

                throw new Error('Gagal mendaftar: ' + error.message);
            }

            console.log('Register auth berhasil:', data);

            // Jika user berhasil dibuat, pastikan data masuk ke tabel users
            if (data.user) {
                console.log('User ID yang dibuat:', data.user.id);

                // Tunggu sebentar untuk trigger berjalan
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    // Cek apakah data sudah ada di tabel users (dari trigger)
                    const { data: existingUser, error: checkError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if (checkError && checkError.code === 'PGRST116') {
                        // User belum ada di tabel, insert manual menggunakan service key
                        console.log('Trigger tidak berjalan, melakukan insert manual ke tabel users');

                        // Cara 1: Insert dengan bypass RLS (menggunakan rpc function)
                        const { data: insertData, error: insertError } = await supabase
                            .rpc('insert_user_profile', {
                                user_id: data.user.id,
                                user_email: cleanEmail,
                                user_nama: userData.nama_lengkap || '',
                                user_telepon: userData.no_telepon || null
                            });

                        if (insertError) {
                            console.warn('RPC insert gagal, mencoba insert biasa:', insertError);

                            // Cara 2: Insert biasa (mungkin berhasil jika policy sudah diperbaiki)
                            const { data: insertData2, error: insertError2 } = await supabase
                                .from('users')
                                .insert({
                                    id: data.user.id,
                                    email: cleanEmail,
                                    nama_lengkap: userData.nama_lengkap || '',
                                    no_telepon: userData.no_telepon || null,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })
                                .select();

                            if (insertError2) {
                                console.warn('Insert manual juga gagal:', insertError2);
                                // Jangan throw error, karena auth user sudah berhasil dibuat
                                // User bisa update profil nanti
                            } else {
                                console.log('Insert manual berhasil:', insertData2);
                            }
                        } else {
                            console.log('RPC insert berhasil:', insertData);
                        }
                    } else if (existingUser) {
                        console.log('Data user sudah ada dari trigger:', existingUser);
                        // User sudah ada dari trigger, update nama_lengkap jika kosong
                        if (!existingUser.nama_lengkap && userData.nama_lengkap) {
                            const { error: updateError } = await supabase
                                .from('users')
                                .update({
                                    nama_lengkap: userData.nama_lengkap,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', data.user.id);

                            if (updateError) {
                                console.error('Error update nama_lengkap:', updateError);
                            } else {
                                console.log('Update nama_lengkap berhasil');
                            }
                        }
                    } else if (checkError) {
                        console.error('Error cek existing user:', checkError);
                    }
                } catch (tableError) {
                    console.warn('Warning: Gagal menyimpan data profil, tapi registrasi auth berhasil:', tableError);
                    // Jangan throw error, karena auth user sudah berhasil dibuat
                    // User bisa melengkapi profil nanti
                }
            }

            // Konfirmasi email mungkin diperlukan
            if (data.user && !data.session) {
                throw new Error('Pendaftaran berhasil! Silakan cek email untuk konfirmasi akun');
            }

            return { user: data.user, session: data.session };

        } catch (error) {
            console.error('Auth register error:', error);
            throw error;
        }
    }

    static async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } catch (error) {
            throw error;
        }
    }

    static async getCurrentUser() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session?.user || null;
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', userData.id);

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }
}

export default AuthController;