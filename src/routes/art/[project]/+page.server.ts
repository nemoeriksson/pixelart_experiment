import { prisma } from '$lib';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({params, cookies}) => {
    let isPublic = false;
    let isOwner = false;
    const projectID = params.project;
    const project = await prisma.project.findUnique({
        where: {
            id: projectID
        },
        include: {
            pixels: true
        }
    });
    let pixels:any;
    
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

    if(user && project){
        if(project?.pixels.length){
            pixels = project.pixels;
        }
        isPublic = project.public;
        isOwner = project.ownerEmail == user.email;
    }
    else
        throw redirect(302, '/art');

    if(!isPublic && !isOwner)
        throw redirect(302, '/art');

    return { project, pixels, isPublic, isOwner, user};
}) satisfies PageServerLoad;

export const actions: Actions = {
    savePixel: async({request, params})=>{
        const project = await prisma.project.findUnique({
            where: {
                id: params.project
            }
        });
        
        const data = await request.formData();
        const x = parseInt(data.get('x')!.toString());
        const y = parseInt(data.get('y')!.toString());
        const color = data.get('color')!.toString();
        const email = data.get('email')!.toString();

        if(project){
            const updatedPixels = await prisma.pixel.updateMany({
                where: {
                    x: x,
                    y: y,
                    projectID: project.id,
                },
                data: {
                    color: color,
                    placedAt: new Date(), 
                    placedBy: email
                }
            });
            
            if(!updatedPixels.count){
                await prisma.pixel.create({
                    data: {
                        x: x,
                        y: y,
                        color: color,
                        projectID: project.id,
                        placedBy: email,
                        placedAt: new Date()
                    }
                });
            }
        }   
    },
    toggleVisibility: async({params, request})=>{
        const projectID = params.project;
        const data = await request.formData();
        const isPublic = data.get('isPublic')?.toString() == 'true';

        await prisma.project.update({
            where: {
                id: projectID
            },
            data: {
                public: !isPublic
            }
        });
    }
};