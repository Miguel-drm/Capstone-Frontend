import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import Colors from '@/constants/Colors'
import { api, auth } from '../utils/api'

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

const ParentDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const slideAnim = useRef(new Animated.Value(-250)).current

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isSidebarOpen ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isSidebarOpen])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await auth.getUser()
        if (userData && userData.name) {
          setUserName(userData.name)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    fetchUserData()
  }, [])

  const menuItems: MenuItem[] = [
    { icon: 'home-outline', label: 'Dashboard', route: '/ParentDashboard' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications' },
    { icon: 'chatbubble-outline', label: 'Chat', route: '/messages' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen)
  }

  const handleLogout = async () => {
    try {
      await api.auth.logout()
      router.replace('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Parent Portal</Text>
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.route
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
                onPress={() => {
                  router.push(item.route)
                  setSidebarOpen(false)
                }}
              >
                <Ionicons 
                  name={item.icon} 
                  size={24} 
                  color={isActive ? '#4A90E2' : '#fff'} 
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.welcomeText}>Welcome, {userName || 'Parent'}</Text>
          {/* Add your dashboard content here */}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default ParentDashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#4A90E2',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sidebarHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  activeMenuText: {
    color: '#fff',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
})

