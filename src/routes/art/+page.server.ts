import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib';

export const load = (async ({cookies}) => {
    const tokenID = cookies.get('token');
    let loggedIn = false;
    let user:any|undefined = undefined;
    let ownedProjects;
    let publicProjects;

    if(tokenID){
        const token = await prisma.token.findUnique({
            where: {
                id: tokenID
            },
            include: {
                user: true
            }
        });
        user = token?.user;
        
        loggedIn = user?true:false;
    }

    if(!loggedIn){
        throw redirect(302, '/');
    }
    else if(user != undefined){
        publicProjects = (await prisma.project.findMany({
            where: {
                public: true,
            },
            include: {
                favoritedBy: true
            }
        })).filter(project => project.ownerEmail != user.email);
    
        ownedProjects = await prisma.project.findMany({
            where: {
                ownerEmail: user.email
            },
            include: {
                favoritedBy: true
            }
        });
    }
    return { publicProjects, ownedProjects, user };
}) satisfies PageServerLoad;

export const actions: Actions = {
    create: async({request, cookies})=>{
        const data = await request.formData();
        const title = data.get('name')!.toString();
        const width = parseInt(data.get('x')!.toString());
        const height = parseInt(data.get('y')!.toString());

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
            const user = token?.user;

            if(user?.email){
                const project = await prisma.project.create({
                    data: {
                        name: title,
                        width: width,
                        height: height,
                        ownerEmail: user.email
                    }
                });
                if(project)
                    throw redirect(302, `/art/${project.id}`);
            }
        }
    },

    star: async({request, cookies})=>{
        const data = await request.formData();
        const projectID = data.get('projectID')?.toString();
        const starred = data.get('starred')?.toString() == 'true';

        const tokenID = cookies.get('token');
        const token = await prisma.token.findUnique({
            where: {
                id: tokenID
            },
            include: {
                user: true
            }
        });
        const user = token?.user;

        if(projectID && user){
            const project = await prisma.project.findUnique({
                where: {
                    id: projectID
                },
                include: {
                    favoritedBy: true
                }
            });

            if(project){
                if([...project.favoritedBy].map(p => p.email).includes(user.email)){
                    await prisma.project.update({
                        where: {
                            id: projectID
                        },
                        data: {
                            favoritedBy: {
                                disconnect: user
                            }
                        }
                    });
                }
                else{
                    await prisma.project.update({
                        where: {
                            id: projectID
                        },
                        data: {
                            favoritedBy: {
                                connect: user
                            }
                        }
                    });
                }
            }
        }
    },

    logout: async({request, cookies})=>{
        cookies.delete('token', {path: '/'});
    }
};