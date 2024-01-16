import { prisma } from '$lib';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as crypto from 'crypto-js';

function hash(original:string, ) : {salt:string, hash:string}{
    const salt = crypto.randomBytes(16).toString('base64');
    const hash = crypto.pbkdf2Sync(original, salt, 1000, 64, 'sha256').toString('base64');
    
    return {salt,hash};
}

function validate(original:string, salt:string, storedHash:string) : boolean{
    const hash = crypto.pbkdf2Sync(original, salt, 1000, 64, 'sha256').toString('base64');
    return hash == storedHash;
}

export const load = (async ({cookies}) => {
    const tokenID = cookies.get('token');
    
    if(tokenID){
        const token = await prisma.token.findUnique({
            where: {
                id: tokenID
            },
            include: {
                user: true
            }
        });
        const user = token?.user

        if(user){
            throw redirect(302, '/art');
        }
    }

    return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
    register: async({request, cookies})=>{
        const data = await request.formData();
        const email = data.get('email')!.toString();
        const password = data.get('password')!.toString();
        
        const passwordData:any = hash(password);
        
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(!existingUser){
            let expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate()+30);

            const user = await prisma.user.create({
                data: {
                    email: email,
                    hash: passwordData.hash,
                    salt: passwordData.salt,
                }
            });

            const token = await prisma.token.create({
                data: {
                    expires: expirationDate,
                    userID: user.id
                }
            });

            cookies.set('token', token.id, {expires: expirationDate, secure: false, path:'/'});
            throw redirect(302, '/art'); 
        }
    }, 
    login: async({request, cookies})=>{
        const data = await request.formData();
        const email = data.get('email')!.toString();
        const password = data.get('password')!.toString();

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(user){
            if(validate(password, user.salt, user.hash)){
                let expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate()+30);

                const token = await prisma.token.create({
                    data: {
                        expires: expirationDate,
                        userID: user.id
                    }
                });

                cookies.set('token', token.id, {expires: expirationDate, secure: false, path:'/'});
                throw redirect(302, '/art');
            }
        }
    }
};