import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring
} from 'react-native-reanimated';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Floating animation for logo
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withSpring(-10, { damping: 10, stiffness: 100 }),
        withSpring(0, { damping: 10, stiffness: 100 })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4A90E2', dark: '#1a2332' }}
      headerImage={
        <View style={[
          styles.headerContainer,
          { backgroundColor: isDark ? '#1a2332' : '#4A90E2' }
        ]}>
          <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
            <Image
              source={require('@/assets/Logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>
        </View>
      }>
      
      {/* Hero Section */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <ThemedView style={styles.heroContainer}>
          <ThemedText type="title" style={styles.heroTitle}>
            Welcome to Bucket
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Organize your goals, dreams, and experiences all in one place
          </ThemedText>
        </ThemedView>
      </Animated.View>

      {/* Features Section */}
      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <ThemedView style={styles.featuresContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Why Bucket?
          </ThemedText>
          
          <FeatureCard
            icon="list.bullet.clipboard"
            title="Track Your Dreams"
            description="Create and manage your bucket list items with ease"
            delay={500}
          />
          
          <FeatureCard
            icon="checkmark.circle.fill"
            title="Mark Achievements"
            description="Celebrate every goal you accomplish"
            delay={600}
          />
          
          <FeatureCard
            icon="photo.stack"
            title="Capture Memories"
            description="Add photos and notes to remember special moments"
            delay={700}
          />
          
          <FeatureCard
            icon="person.2.fill"
            title="Share with Friends"
            description="Inspire others and get inspired by their journeys"
            delay={800}
          />
        </ThemedView>
      </Animated.View>

      {/* CTA Section */}
      <Animated.View entering={FadeInUp.delay(900).duration(600)}>
        <ThemedView style={styles.ctaContainer}>
          <CTAButton 
            title="Get Started" 
            primary 
            onPress={() => console.log('Get Started pressed')}
          />
          <CTAButton 
            title="Learn More" 
            onPress={() => console.log('Learn More pressed')}
          />
        </ThemedView>
      </Animated.View>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Start building your bucket list today
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }: { 
  icon: any; 
  title: string; 
  description: string;
  delay: number;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
      <ThemedView style={[
        styles.featureCard,
        { 
          backgroundColor: isDark ? '#1f2937' : '#f8fafc',
          borderWidth: 1,
          borderColor: isDark ? '#374151' : '#e2e8f0'
        }
      ]}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isDark ? '#3b82f6' : '#4A90E2' }
        ]}>
          <IconSymbol name={icon} size={28} color="#fff" />
        </View>
        <View style={styles.featureContent}>
          <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
            {title}
          </ThemedText>
          <ThemedText style={styles.featureDescription}>
            {description}
          </ThemedText>
        </View>
      </ThemedView>
    </Animated.View>
  );
}

// CTA Button Component
function CTAButton({ title, primary, onPress }: { 
  title: string; 
  primary?: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctaButton,
        primary ? {
          backgroundColor: isDark ? '#3b82f6' : '#4A90E2',
        } : {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: isDark ? '#3b82f6' : '#4A90E2',
        },
        pressed && { opacity: 0.7 }
      ]}
    >
      <ThemedText 
        style={[
          styles.ctaButtonText,
          { color: primary ? '#fff' : (isDark ? '#3b82f6' : '#4A90E2') }
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 26,
    maxWidth: 320,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 16,
    alignItems: 'center',
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: width * 0.7,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
