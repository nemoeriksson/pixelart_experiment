<style type="text/scss">
@import '/style/project.scss';
</style>

<script lang="ts">
import { onMount } from 'svelte';
import type { PageData } from './$types';
import { Color, ColorInput } from 'color-picker-svelte'
import { invalidateAll } from '$app/navigation';
import { enhance } from '$app/forms';

class Pixel {
    x:number;
    y:number;
    color:string;
    border:string;
    owner:string|undefined;
    placedAt:Date;

    constructor(x:number, y:number, owner:string|undefined=undefined, placedAt:any=new Date(), color:string='#fff') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.owner = owner;
        this.placedAt = placedAt;
        this.border = '#000';
    }

    draw(){
        c.fillStyle = this.color;
        c.strokeStyle = '#101014';
        c.fillRect(this.x*blockSize, this.y*blockSize, blockSize, blockSize);
        if(drawGrid && Math.abs(+new Date() - +this.placedAt) <= placedPixelFadeDurationMs && this.owner != user.email && this.owner){
            this.border = invertColor(this.color);
            c.strokeStyle = this.border;
            c.strokeRect(this.x*blockSize, this.y*blockSize, blockSize, blockSize);
        }
        else if (drawGrid)
            c.strokeRect(this.x*blockSize, this.y*blockSize, blockSize, blockSize);
    }

    async save(){
        const pixelData = new FormData();
        pixelData.append('x', this.x.toString());
        pixelData.append('y', this.y.toString());
        pixelData.append('color', this.color);
        pixelData.append('email', user.email);
        await fetch('?/savePixel', {
            method: 'POST',
            body: pixelData
        });
    }
}

function changeColorPalette(){
    activePalette = paletteDropdown.value;
    currentPalette = palettes[activePalette];
}

function invertColor(hex:string) {
    if(hex[0] == '#')
        hex = hex.slice(1);
    
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    let res = (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#FFFFFF';
    return res;
}

function drawCanvas(){
    pixels.forEach(row => {
        row.forEach(block=>{
            block.draw();
        });
    });
}

function drawPixel(e:MouseEvent){
    let x = e.offsetX;
    let y = e.offsetY;
    let xBlock = Math.floor(x/blockSize);
    let yBlock = Math.floor(y/blockSize);
    let targetPixel = pixels[yBlock][xBlock];
    let currentColor = targetPixel.color;
    if((pencilColor != currentColor && mouseMode == 'draw') || (currentColor != '#fff' && mouseMode == 'erase')){
        if (mouseMode == 'draw')
            targetPixel.color = pencilColor;
        else if (mouseMode == 'erase')
            targetPixel.color = '#fff'
        targetPixel.draw();
        pixels = pixels;
        targetPixel.save();
    }
}

const palettes: { [key: string]: string[] } = {
    'standard': ['#000', '#fff', '#ff0000', 'maroon', '#0000ff', 'navy', 'lime', '#00ff00', 'yellow', 'orange', 'magenta', 'purple', ],
    'blu': ['#164863', '#427D9D', '#9BBEC8', '#DDF2FD', '#C5DFF8', '#A0BFE0', '#7895CB', '#4A55A2'],
    'green': ['#ECE3CE', '#739072', '#4F6F52', '#3A4D39'],
    'beige': ['#F3EEEA', '#EBE3D5', '#B0A695', '#776B5D']
}
const placedPixelFadeDurationMs = 5000;
let canvas:HTMLCanvasElement;
let canvasContainer:HTMLElement;
let paletteDropdown:HTMLSelectElement;
let downloadLink:HTMLAnchorElement;
let c:CanvasRenderingContext2D;
let height:number, width:number, blockSize:number;
let mouseDown = false;
let mouseMode = 'draw';
let color = new Color('#F29559');
let activePalette = 'standard';
let drawGrid = true;
let hoveredName:string|undefined = undefined;
let currentPalette:string[] = palettes['standard'];
$: pencilColor = color.toHexString();
export let data: PageData;
const project = data.project

$: pixels = generatePixels(data.pixels);
$: isPublic = data.isPublic;
$: isOwner = data.isOwner;
$: user = data.user;

function generatePixels(source:any){
    let pixels:Pixel[][] = [];
    pixels = new Array(project.height)
        .fill(null)
        .map((_,row) => new Array(project.width)
            .fill(null)
            .map((_,col) => new Pixel(col, row)
    ));
    if(source){
        source.forEach((pixel: {
            x: number,
            y: number,
            color: string,
            projectID: string,
            placedBy: string,
            placedAt: any,
        }) => {
            let newPixel = new Pixel(pixel.x, pixel.y, pixel.placedBy, pixel.placedAt, pixel.color);
            pixels[pixel.y][pixel.x] = newPixel;
        });
    }
    return pixels;
}

function getHovering(e:MouseEvent){
    let x = e.offsetX;
    let y = e.offsetY;
    let xBlock = Math.floor(x/blockSize);
    let yBlock = Math.floor(y/blockSize);
    let targetPixel = pixels[yBlock][xBlock];
    return targetPixel.owner?.split('@')[0];
}

onMount(()=>{
    setInterval(()=>{
        invalidateAll();
        drawCanvas();
        
        if(!isOwner && !isPublic){
            console.log('kicked');
        }
    }, 1000);

    if (project.width >= project.height)
        blockSize = Math.floor((canvasContainer.offsetHeight-4) / project.height);
    else
        blockSize = Math.floor((canvasContainer.offsetWidth-4) / project.width);
    height = blockSize * project.height;
    width = blockSize * project.width;
    canvas.width = width;
    canvas.height = height;
    c = canvas.getContext('2d')!;

    drawCanvas();

    canvas.addEventListener('mousedown', (e:MouseEvent)=> {mouseDown = true; drawPixel(e);});
    canvas.addEventListener('mouseup', ()=>{mouseDown = false})

    canvas.addEventListener('mousemove', (e:MouseEvent)=>{
        if(mouseDown){
            drawPixel(e);
        }
        else if(mouseMode == 'inspect')
            hoveredName = getHovering(e);
    });
    canvas.addEventListener('mouseleave', ()=>{
        hoveredName = undefined;
    });
});
</script>

<main id="project">
    <nav id="options">
        <a bind:this={downloadLink} on:click={(e)=>{
            let first = downloadLink.getAttribute('href') == '#';
            if(first)
                e.preventDefault();
            downloadLink.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
            if(first)
                downloadLink.click()
        }} href="#" download="painting.png">Save As Image</a>
        <button on:click={()=>{drawGrid=!drawGrid}}>Toggle Grid</button>
        {#if isOwner}
            <form action="?/toggleVisibility" method="post" use:enhance>
                <input type="hidden" name="isPublic" value={isPublic}>
                <button type="submit">
                    {#if isPublic}
                        Make Private
                    {:else}
                        Make Public
                    {/if}
                </button>
            </form>
        {/if}
    </nav>
    <div class="content">
        <section id="tools">
            <div class="i-1" class:active={mouseMode=='draw'} on:click={()=>{mouseMode = 'draw'}} aria-hidden='true' title='Pencil'></div>
            <div class="i-2" class:active={mouseMode=='erase'} on:click={()=>{mouseMode = 'erase'}} aria-hidden='true' title='Eraser'></div>
            <div class="i-3" class:active={mouseMode=='inspect'} on:click={()=>{mouseMode = 'inspect'}} aria-hidden='true' title='Inspector'></div>
            <div class="texts">
                {#if mouseMode == 'inspect'}
                    {#if hoveredName != undefined}
                        <p>Placed by {hoveredName}</p>
                    {:else}
                        <p>No changes found</p>
                    {/if}
                {/if}
            </div>
        </section>
        <section id="drawing" bind:this={canvasContainer}>
            <canvas bind:this={canvas}></canvas>
        </section>
        <section id="colors">
            <div class="selector">
                <ColorInput bind:color title={pencilColor} />
            </div>

            <div class="palette">
                <select bind:this={paletteDropdown} on:change={changeColorPalette}>
                    {#each Object.entries(palettes) as [key,_]}
                        <option value={key}>{key}</option> 
                    {/each}
                </select>
                <div class="colors">
                    {#each currentPalette as color}
                        <span class="color" title={color} on:click={()=>{pencilColor=color}} style={`background: ${color}`} aria-hidden='true'></span>
                    {/each}
                </div>
            </div>
        </section>
    </div>    
</main>
