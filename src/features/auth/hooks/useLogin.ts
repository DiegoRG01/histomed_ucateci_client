import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/login'
import { useAuth } from './useAuth'

export function useLogin() {
  const { setSession } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.token)
      navigate('/', { replace: true })
    },
  })
}
