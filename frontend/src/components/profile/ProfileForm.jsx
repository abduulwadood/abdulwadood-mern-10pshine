import { useState } from 'react'
import { Pencil, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function ProfileForm({ user, onSave, onCancel, isSaving }) {
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName]   = useState(user?.lastName  || '')
  const [errors, setErrors]       = useState({})

  const hasChanges =
    firstName.trim() !== (user?.firstName || '') ||
    lastName.trim()  !== (user?.lastName  || '')

  function validate() {
    const e = {}
    if (!firstName.trim())        e.firstName = 'First name is required'
    if (firstName.length > 50)    e.firstName = 'First name must be 50 characters or fewer'
    if (lastName.length > 50)     e.lastName  = 'Last name must be 50 characters or fewer'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({ firstName: firstName.trim(), lastName: lastName.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Pencil className="w-4 h-4 text-indigo-600" />
        Edit Profile
      </h3>

      {/* First name */}
      <div className="mb-4">
        <Label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
          First Name
        </Label>
        <Input
          id="firstName"
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="Enter your first name"
          maxLength={50}
          disabled={isSaving}
          className={errors.firstName ? 'border-red-400 focus-visible:ring-red-300' : ''}
        />
        {errors.firstName
          ? <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
          : <p className="text-xs text-gray-400 mt-1">{firstName.length}/50</p>
        }
      </div>

      {/* Last name */}
      <div className="mb-6">
        <Label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
          Last Name <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <Input
          id="lastName"
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          placeholder="Enter your last name"
          maxLength={50}
          disabled={isSaving}
          className={errors.lastName ? 'border-red-400 focus-visible:ring-red-300' : ''}
        />
        {errors.lastName
          ? <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
          : <p className="text-xs text-gray-400 mt-1">{lastName.length}/50</p>
        }
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || !hasChanges}
          className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 gap-1.5"
        >
          {isSaving
            ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</>
            : <><Save className="w-3 h-3" />Save Changes</>
          }
        </Button>
      </div>
    </form>
  )
}
