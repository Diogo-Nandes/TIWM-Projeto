import { FirebaseError } from '@firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RegistoScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const signUp = async () => {
    if (!username.trim()) {
      setErrorMsg('O nome de utilizador é obrigatório.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('O email é obrigatório.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('A palavra-passe é obrigatória.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      // Guarda o nome de utilizador na coleção Utilizadores
      await firestore().collection('Utilizadores').add({
        uid: userCredential.user.uid,
        Username: username,
      });
    } catch (e: any) {
      const err = e as FirebaseError;
      setErrorMsg('Registo falhou: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Regista-te para começar</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nome de Utilizador"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="words"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#2196F3" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#aaa"
            />
          </View>
          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" style={{ margin: 24 }} />
          ) : (
            <TouchableOpacity style={styles.buttonPrimary} onPress={signUp}>
              <Text style={styles.buttonText}>Criar Conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.link}>Já tens conta? Inicia sessão aqui</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f8fc',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#222',
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    width: 200,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#2196F3',
    marginTop: 20,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 15,
    textAlign: 'center',
  },
  error: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: -8,
    fontWeight: 'bold',
  },
});
