import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type UserProfile = {
  isCuidador?: boolean;
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        const snapshot = await firestore()
          .collection('Utilizadores')
          .where('uid', '==', user.uid)
          .limit(1)
          .get();

        setUserProfile(snapshot.docs[0]?.data() || null);
      } else {
        setUserProfile(null);
      }
      setUser(user);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const currentSegment = segments[0];
    const isAuthRoute = currentSegment === '(auth)';
    const isTabsRoute = currentSegment === '(tabs)';
    const isCuidadorRoute = currentSegment === '(cuidador)';

    if (!user && !isAuthRoute) {
      router.replace('/(auth)');
      return;
    }

    if (user && userProfile) {
      const targetRoute = userProfile.isCuidador ? '(cuidador)' : '(tabs)';
      if (
        (userProfile.isCuidador && !isCuidadorRoute) ||
        (!userProfile.isCuidador && !isTabsRoute)
      ) {
        router.replace(targetRoute as any);
      }
    }
  }, [isReady, user, userProfile, segments]);

  if (!isReady || (user && !userProfile)) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(cuidador)" options={{ headerShown: false }} />
    </Stack>
  );
}
