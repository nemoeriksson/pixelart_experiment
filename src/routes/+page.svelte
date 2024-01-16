<style type="text/scss">
@import '/style/home.scss';
</style>
    
<script lang="ts">
import { enhance } from "$app/forms";
</script>

<main id="home">
    <div class="register">
        <p class="title">Register</p>
        <form action="?/register" method="post" autocomplete="off" use:enhance>
            <div class="inputField">
                <label for="email-reg">Email</label>
                <input required type="text" name="email" id="email-reg">
            </div>
            
            <div class="inputField">
                <label for="password-reg">Password</label>
                <input required type="password" name="password" id="password-reg">
            </div>
            <button>Register</button>
        </form>
    </div>

    <div class="login">
        <p class="login">Login</p>
        <form action="?/login" method="post" autocomplete="off" use:enhance>
            <div class="inputField">
                <label for="email-login">Email</label>
                <input required type="text" name="email" id="email-login">
            </div>
            
            <div class="inputField">
                <label for="password-login">Password</label>
                <input required type="password" name="password" id="password-login">
            </div>
            <button>Login</button>
        </form>
    </div>  
</main>