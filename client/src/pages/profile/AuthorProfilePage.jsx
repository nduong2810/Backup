import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import FormAlert from '../../components/ui/FormAlert';
import { getPublicAuthorProfileApi } from '../../services/donationService';

const statusLabelMap = {
  completed: 'Đã duyệt',
  pending_review: 'Chờ duyệt',
  pending_payment: 'Chờ thanh toán',
  rejected: 'Đã từ chối',
};

const paymentMethodLabelMap = {
  cod: 'Chuyển khoản/COD',
  vnpay: 'VNPAY sandbox',
};

export default function AuthorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorProfile, setAuthorProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getPublicAuthorProfileApi(id);
        if (!mounted) return;
        setAuthorProfile(response?.data?.data || null);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError?.response?.data?.message || 'Không thể tải hồ sơ tác giả.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <AppCard title="Hồ sơ tác giả" subtitle="Không thể tải dữ liệu">
          <FormAlert type="error" message={error} />
          <div className="mt-5 flex gap-3">
            <AppButton onClick={() => navigate(-1)}>Quay lại</AppButton>
            <AppButton variant="secondary" onClick={() => navigate('/home')}>Về trang chủ</AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  if (!authorProfile) return null;

  const { user, donations, donationSummary } = authorProfile;

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Quay lại
        </button>
        <Link
          to="/user/profile"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          Hồ sơ của tôi
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AppCard title={user.fullName} subtitle={user.major || 'Tác giả cộng đồng'}>
          <div className="flex items-center gap-4">
            <img
              src={user.avatar && user.avatar !== 'default-avatar.png'
                ? user.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=0f766e&color=fff&size=120`
              }
              alt={user.fullName}
              className="h-24 w-24 rounded-3xl border border-slate-200 object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{user.email}</p>
              {user.bio ? <p className="mt-2 text-sm leading-6 text-slate-700">{user.bio}</p> : <p className="mt-2 text-sm text-slate-500">Chưa có bio.</p>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Tổng donate</div>
              <div className="mt-1 text-xl font-bold text-amber-700">{Number(donationSummary?.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Lượt nhận</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{donationSummary?.donationCount || 0}</div>
            </div>
          </div>
        </AppCard>

        <AppCard title="Lịch sử ủng hộ" subtitle="Danh sách các lượt donate đã được ghi nhận">
          {donations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Chưa có lượt ủng hộ nào được duyệt cho tác giả này.
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={donation.donor?.avatar && donation.donor.avatar !== 'default-avatar.png'
                          ? donation.donor.avatar
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(donation.donor?.fullName || 'U')}&background=475569&color=fff&size=48`
                        }
                        alt={donation.donor?.fullName}
                        className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{donation.donor?.fullName || donation.donorSnapshot?.fullName || 'Ẩn danh'}</div>
                        <div className="text-xs text-slate-500">{new Date(donation.createdAt).toLocaleString('vi-VN')}</div>
                        <div className="mt-1 text-sm text-slate-600">{donation.post?.title || donation.postSnapshot?.title || 'Bài viết'}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-700">{Number(donation.amount || 0).toLocaleString('vi-VN')}đ</div>
                      <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {paymentMethodLabelMap[donation.paymentMethod] || donation.paymentMethod}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {statusLabelMap[donation.status] || donation.status}
                      </div>
                    </div>
                  </div>

                  {donation.answerSnapshot?.content && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                      {donation.answerSnapshot.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}