<template>
    <div class="main">
        <h3>INPUT TEXT</h3>
        <b-form class="text-form">
        <b-form-group>
            <textarea id="text" name="input" rows="4" cols="50" v-model="text">
            Text
            </textarea>
        </b-form-group>

        <label class="submit">
            <b-button variant="outline-primary" @click="onSubmit">Check Text</b-button>
        </label>
        </b-form>
        <h5>{{message}}</h5>
    </div>
</template>

<script>
import { ref } from '@vue/composition-api';
import axios from 'axios';

export default {
    name: 'Home',
    setup() {
        const text = ref('');
        const message = ref('');

        async function onSubmit() {
            var formData = {
                "text": text.value,
            }

            console.log(formData);

            try {
                await axios.post('http://localhost:4000/postText', formData);
                message.value = 'Test Text';
            } catch (err) {
                console.log(err);
                message.value = err;
            }
        };

        return {
            text,
            message,
            onSubmit
        };
    }
}

</script>

<style scoped>

h2 {
    font-weight: bold;
}

.main {
  display: flex;
  padding: 50px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.text-form {
  width: 800px;
  display: flex;
  flex-direction: column;
  margin: 40px 40px;
  padding: 20px;
}

.input {
    height: 200px;
}

.check {
  float: left;
  margin: 4px;
}

</style>