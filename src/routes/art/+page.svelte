<style type="text/scss">
    @import '/style/art.scss';
</style>
<script lang="ts">
import { browser } from '$app/environment';
import { enhance } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { PageData } from './$types';

export let data: PageData;
$: publicProjects = data.publicProjects;
$: ownedProjects = data.ownedProjects;
$: user = data.user;

$: favPublic = publicProjects?.filter(p => checkFavorited(p, user.email));
$: nonfavPublic = publicProjects?.filter(p => !checkFavorited(p, user.email));
$: favOwned = ownedProjects?.filter(p => checkFavorited(p, user.email));
$: nonfavOwned = ownedProjects?.filter(p => !checkFavorited(p, user.email));

$: publicListing = favPublic?.sort((a, b) => a.name.localeCompare(b.name)).concat(nonfavPublic?.sort((a, b) => a.name.localeCompare(b.name)) || []);
$: ownedListing = favOwned?.sort((a, b) => a.name.localeCompare(b.name)).concat(nonfavOwned?.sort((a, b) => a.name.localeCompare(b.name)) || []);

function checkFavorited(project_:any, email_:string){
    return [...project_.favoritedBy].map(p => p.email).includes(email_);
}

function refresh(){
    invalidateAll();
}

if(browser){
    setInterval(refresh, 1000);
}
</script>

<main id="art">
    <div class="new">
        <div class="logout">
            <form action="?/logout" method="post" autocomplete="off" use:enhance>
                <button>Log Out</button>
            </form>
        </div>
        <p class="title">Create New Project</p> 
        <form action="?/create" method="post" autocomplete="off" use:enhance>
            <div class="inputField">
                <label for="name">Project Title</label>
                <input required type="text" name="name" id="name">
            </div>
            <div class="inputField">
                <label for="x">Canvas Width (px)</label>
                <input required min="1" max="64" value=32 type="number" name="x" id="x">
            </div>
            <div class="inputField">
                <label for="y">Canvas Height (px)</label>
                <input required min="1" max="64" value=32 type="number" name="y" id="y">
            </div>
            <button>Create</button>
        </form>
    </div>

    <div class="projects">
        <div class="public">
            <h2>Public Projects: </h2>
            {#if publicListing?.length}
                {#each publicListing as project}
                    <div class="project">
                        <form action="?/star" method="post" class:active={checkFavorited(project, user.email)} class="star" use:enhance>
                            <input type="hidden" name="projectID" value={project.id}>
                            <button type="submit"></button>
                        </form>
                        <div class="title">{project.name} ({project.width}x{project.height})</div>
                        <p class="owner">By {project.ownerEmail.split('@')[0]}</p>
                        <div class="buttons">
                            <a href={`/art/${project.id}`}>Open</a>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
        <div class="owned">
            <h2>Your Projects: </h2>
            {#if ownedListing?.length}
                {#each ownedListing as project}
                    <div class="project">
                        <form action="?/star" method="post" class:active={checkFavorited(project, user.email)} class="star" use:enhance>
                            <input type="hidden" name="projectID" value={project.id}>
                            <button type="submit"></button>
                        </form>
                        <div class="title">{project.name}</div>
                        <p class="size">{project.width}x{project.height} pixels</p>
                        <p class="visibility">{project.public ? 'Public' : 'Private'}</p>
                        <div class="buttons">
                            <a href={`/art/${project.id}`}>Open</a>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</main>
