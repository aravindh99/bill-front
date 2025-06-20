import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import { getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [formData, setFormData] = useState({
    logo: '',
    companyName: '',
    country: '',
    city: '',
    pinCode: '',
    defaultCurrency: 'INR',
    state: '',
    address: '',
    email: '',
    phone: '',
    serviceTaxNo: '',
    website: '',
    taxationType: '',
    contactName: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/profiles');
      if (response.data.length > 0) {
        const profileData = response.data[0];
        setProfile(profileData);
        setFormData({
          logo: profileData.logo || '',
          companyName: profileData.companyName || '',
          country: profileData.country || '',
          city: profileData.city || '',
          pinCode: profileData.pinCode || '',
          defaultCurrency: profileData.defaultCurrency || 'INR',
          state: profileData.state || '',
          address: profileData.address || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          serviceTaxNo: profileData.serviceTaxNo || '',
          website: profileData.website || '',
          taxationType: profileData.taxationType || '',
          contactName: profileData.contactName || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch profile'), getErrorType(error));
    } finally {
      setLoading(false);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (profile) {
        await axios.put(`/profiles/${profile.id}`, formData);
        showErrorModal('Success', 'Profile updated successfully!', 'success');
      } else {
        const response = await axios.post('/profiles', formData);
        showErrorModal('Success', 'Profile created successfully!', 'success');
        // Update the profile state with the newly created profile
        setProfile(response.data.profile);
      }
      setShowModal(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save profile'), getErrorType(error));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, logo: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600">Manage your company information</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span className="mr-2">✏️</span>
          {profile ? 'Edit Profile' : 'Create Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Company Information</h2>
          </div>
          <div className="card-content">
            {profile ? (
              <div className="space-y-4">
                {profile.logo && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={profile.logo} 
                      alt="Company Logo" 
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-gray-900">{profile.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Person</label>
                  <p className="text-gray-900">{profile.contactName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Website</label>
                  <p className="text-gray-900">{profile.website || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Taxation Type</label>
                  <p className="text-gray-900">{profile.taxationType || 'Not specified'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">🏢</span>
                <p>No profile information found</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary mt-4"
                >
                  Create Profile
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Address & Tax Information</h2>
          </div>
          <div className="card-content">
            {profile ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{profile.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <p className="text-gray-900">{profile.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">State</label>
                  <p className="text-gray-900">{profile.state || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-gray-900">{profile.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">PIN Code</label>
                  <p className="text-gray-900">{profile.pinCode || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Service Tax No</label>
                  <p className="text-gray-900">{profile.serviceTaxNo || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Default Currency</label>
                  <p className="text-gray-900">{profile.defaultCurrency}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📍</span>
                <p>No address information found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="form-input"
                  />
                  {formData.logo && (
                    <div className="mt-2">
                      <img 
                        src={formData.logo} 
                        alt="Preview" 
                        className="h-16 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
                
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="form-input"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Currency</label>
                    <select
                      name="defaultCurrency"
                      value={formData.defaultCurrency}
                      onChange={(e) => setFormData({...formData, defaultCurrency: e.target.value})}
                      className="form-input"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group form-full-width">
                  <label className="form-label">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="form-input"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Tax No</label>
                    <input
                      type="text"
                      name="serviceTaxNo"
                      value={formData.serviceTaxNo}
                      onChange={(e) => setFormData({...formData, serviceTaxNo: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taxation Type</label>
                    <select
                      name="taxationType"
                      value={formData.taxationType}
                      onChange={(e) => setFormData({...formData, taxationType: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select Taxation Type</option>
                      <option value="GST">GST</option>
                      <option value="VAT">VAT</option>
                      <option value="Sales Tax">Sales Tax</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {profile ? 'Update' : 'Create'} Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ModernModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '', type: 'error' })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
};

export default Profile; 